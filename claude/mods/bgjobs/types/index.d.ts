export type Job = {
  pgid: number
  command: string
  cwd: string
  ports: number[]
  etime: string
  cpu: number
  rssKb: number
  isOwnerAlive: boolean
}

declare module 'claude-code' {
  interface PluginState {
    bgjobs: {
      jobs: Job[]
      isOpen: boolean
    }
  }
}
