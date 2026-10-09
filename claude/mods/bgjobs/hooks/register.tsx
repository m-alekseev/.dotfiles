import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Job } from '../types'

const PERIOD = 3000
const SYSTEM = /^(\/System|\/usr|\/sbin|\/bin|\/Applications|\/Library)\//
const SHELL = /^(\/\S*\/)?(zsh|bash|sh)(\s|$)/
const CLAUDE = /^claude(\s|$)/
const WRAPPER = '/.claude/shell-snapshots/'
const DIR = 30
const CPU = 5
const MEM = 6
const UP = 9
const OWN = 8

const jobs = atom({ plugin: 'bgjobs', key: 'jobs' } as const, [] as Job[])
const isOpen = atom({ plugin: 'bgjobs', key: 'isOpen' } as const, false)

const envOf = (line: string, key: string) =>
  line.match(new RegExp(`\\s${key}=(\\S*)`))?.[1]

const clip = (text: string, width: number) =>
  text.length > width ? `${text.slice(0, Math.max(1, width - 1))}…` : text

const tail = (text: string, width: number) =>
  text.length > width ? `…${text.slice(text.length - Math.max(1, width - 1))}` : text

const left = (text: string, width: number) => clip(text, width).padEnd(width)

const memory = (kb: number) =>
  kb >= 1048576 ? `${(kb / 1048576).toFixed(1)}G` : kb >= 1024 ? `${Math.round(kb / 1024)}M` : `${kb}K`

const order = (list: readonly Job[]) =>
  [...list].sort(
    (a, b) =>
      Number(a.isOwnerAlive) - Number(b.isOwnerAlive) ||
      b.ports.length - a.ports.length ||
      a.pgid - b.pgid,
  )

const run = async ($: EngineInterface, argv: string[]) => {
  try {
    return (await $.process.run(argv)).stdout
  } catch {
    return ''
  }
}

const scan = async ($: EngineInterface) => {
  const uid = (await run($, ['id', '-u'])).trim()
  const home = (await run($, ['printenv', 'HOME'])).trim()
  const procs = new Map<
    number,
    { ppid: number; pgid: number; etime: string; cpu: number; rss: number; command: string }
  >()
  for (const line of (
    await run($, ['ps', '-axwwo', 'uid=,pid=,ppid=,pgid=,etime=,pcpu=,rss=,command='])
  ).split('\n')) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+([\d.]+)\s+(\d+)\s+(.*)$/)
    if (m && m[1] === uid)
      procs.set(Number(m[2]), {
        ppid: Number(m[3]),
        pgid: Number(m[4]),
        etime: m[5],
        cpu: Number(m[6]),
        rss: Number(m[7]),
        command: m[8],
      })
  }

  const candidates = [...procs]
    .filter(([, p]) => !SYSTEM.test(p.command))
    .map(([pid]) => pid)
  const owners = new Map<number, number>()
  for (let i = 0; i < candidates.length; i += 100) {
    const out = await run($, [
      'ps',
      '-wwE',
      '-p',
      candidates.slice(i, i + 100).join(','),
      '-o',
      'pid=,command=',
    ])
    for (const line of out.split('\n')) {
      const pid = Number(line.match(/^\s*(\d+)\s/)?.[1])
      const session = envOf(line, 'CLAUDE_CODE_SESSION_ID')
      const owner = Number(envOf(line, 'CLAUDE_PID'))
      if (pid && session && owner && pid !== owner) owners.set(pid, owner)
    }
  }

  const roots = new Set<number>()
  for (const pid of owners.keys()) roots.add(procs.get(pid)!.pgid)
  for (const [, p] of procs) if (p.command.includes(WRAPPER)) roots.add(p.pgid)

  const groups = new Map<number, number[]>()
  for (const [pid, p] of procs)
    if (roots.has(p.pgid) && !CLAUDE.test(p.command))
      groups.set(p.pgid, [...(groups.get(p.pgid) ?? []), pid])
  for (const [pgid, pids] of groups)
    if (pids.every(pid => SHELL.test(procs.get(pid)!.command))) groups.delete(pgid)

  const lead = (pids: number[]) =>
    pids.find(pid => !SHELL.test(procs.get(pid)!.command)) ?? pids[0]

  const ports = new Map<number, number[]>()
  let current = 0
  for (const line of (await run($, ['lsof', '-nP', '-iTCP', '-sTCP:LISTEN', '-Fpn'])).split(
    '\n',
  )) {
    if (line[0] === 'p') current = Number(line.slice(1))
    else if (line[0] === 'n') {
      const port = Number(line.slice(line.lastIndexOf(':') + 1))
      if (port) ports.set(current, [...(ports.get(current) ?? []), port])
    }
  }

  const cwds = new Map<number, string>()
  const leaders = [...groups.values()].map(lead)
  if (leaders.length > 0) {
    current = 0
    for (const line of (
      await run($, ['lsof', '-a', '-d', 'cwd', '-Fpn', '-p', leaders.join(',')])
    ).split('\n')) {
      if (line[0] === 'p') current = Number(line.slice(1))
      else if (line[0] === 'n') cwds.set(current, line.slice(1))
    }
  }

  const found: Job[] = [...groups].map(([pgid, pids]) => {
    const leader = lead(pids)
    const wrapper = pids.find(pid => procs.get(pid)!.command.includes(WRAPPER))
    const owner =
      pids.map(pid => owners.get(pid)).find(Boolean) ??
      (wrapper ? procs.get(wrapper)!.ppid : 0)
    const cwd = cwds.get(leader) ?? ''

    return {
      pgid,
      command: procs.get(leader)!.command,
      cwd: home && cwd.startsWith(home) ? `~${cwd.slice(home.length)}` : cwd,
      ports: [...new Set(pids.flatMap(pid => ports.get(pid) ?? []))].sort((a, b) => a - b),
      etime: procs.get(leader)!.etime,
      cpu: pids.reduce((sum, pid) => sum + procs.get(pid)!.cpu, 0),
      rssKb: pids.reduce((sum, pid) => sum + procs.get(pid)!.rss, 0),
      isOwnerAlive: owner > 1 && procs.has(owner),
    }
  })
  await update($, jobs, () => found)
}

let timer: { cancel: () => void } | undefined

const shut = async ($: EngineInterface) => {
  timer?.cancel()
  await update($, isOpen, () => false)
}

export const register: Register = on => {
  on('command.run', { command: 'bgjobs' }, async $ => {
    if (await read($, isOpen)) {
      await shut($)

      return { text: 'Background jobs closed.' }
    }

    await update($, isOpen, () => true)
    await scan($)
    timer?.cancel()
    timer = $.clock.every(PERIOD, () => {
      void (async () => {
        if (!(await read($, isOpen))) {
          timer?.cancel()
          return
        }
        await scan($)
      })()
    })

    return { text: 'Background jobs shown above the prompt.' }
  })

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'bgjobs',
      description: 'Show processes started by Claude sessions above the prompt',
    })

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isOpen))) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const list = order(await read($, jobs))
    const cols = e.props.bodyColumns - 2
    const cap = Math.max(1, e.props.maxRows - 4)
    const shown = list.slice(0, cap)
    const more = list.length - shown.length
    const orphans = list.filter(job => !job.isOwnerAlive).length
    const hasDir = cols >= 90
    const ports = (job: Job) => job.ports.map(port => `:${port}`).join(',')
    const portW = Math.min(14, Math.max(4, ...shown.map(job => ports(job).length)))
    const dirW = hasDir ? Math.min(DIR, Math.max(3, ...shown.map(job => job.cwd.length))) : 0
    const gaps = (hasDir ? 6 : 5) * 2
    const fixed = portW + dirW + CPU + MEM + UP + OWN + gaps
    const wide = Math.min(
      40,
      Math.max(7, ...shown.map(job => job.command.length)),
      Math.max(10, cols - fixed),
    )
    const line = (key: string, child: unknown) => (
      <Box key={key}>
        <Text color="claude">┃ </Text>
        <Box flexGrow={1}>{child}</Box>
      </Box>
    )

    return (
      <Box flexDirection="column" marginTop={1}>
        {line(
          'head',
          <Text wrap="truncate-end">
            <Text bold color="claude">
              BACKGROUND JOBS
            </Text>
            <Text color="subtle">
              {' · '}
              {list.length} {list.length === 1 ? 'job' : 'jobs'}
            </Text>
            {orphans > 0 && (
              <Text color="warning">
                {' · '}
                {orphans} {orphans === 1 ? 'orphan' : 'orphans'}
              </Text>
            )}
            {more > 0 && <Text color="subtle">{` · ${more} more`}</Text>}
          </Text>,
        )}
        {line(
          'cols',
          <Text bold color="subtle" wrap="truncate-end">
            {left('COMMAND', wide)}
            {'  '}
            {left('PORT', portW)}
            {'  '}
            {hasDir ? `${left('DIR', dirW)}  ` : ''}
            {left('CPU', CPU)}
            {'  '}
            {left('MEM', MEM)}
            {'  '}
            {left('UP', UP)}
            {'  '}
            {left('OWNER', OWN)}
          </Text>,
        )}
        {line(
          'rule',
          <Text color="inverseText">{'─'.repeat(Math.max(1, Math.min(cols - 2, wide + portW + dirW + CPU + MEM + UP + OWN + gaps)))}</Text>,
        )}
        {list.length === 0 &&
          line(
            'empty',
            <Text color="subtle">No background jobs found. Processes started by Claude show up here.</Text>,
          )}
        {shown.map(job =>
          line(
            String(job.pgid),
            <Text wrap="truncate-end">
              <Text color="text">{`${left(job.command, wide)}  `}</Text>
              <Text color="claude">{`${left(ports(job), portW)}  `}</Text>
              {hasDir && <Text color="subtle">{`${tail(job.cwd, dirW).padEnd(dirW)}  `}</Text>}
              <Text color="subtle">
                {`${left(`${job.cpu.toFixed(1)}%`, CPU)}  ${left(memory(job.rssKb), MEM)}  ${left(job.etime, UP)}  `}
              </Text>
              <Text color={job.isOwnerAlive ? 'success' : 'warning'}>
                {left(job.isOwnerAlive ? '● alive' : '○ orphan', OWN)}
              </Text>
            </Text>,
          ),
        )}
      </Box>
    )
  })
}
