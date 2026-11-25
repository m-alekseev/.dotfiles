local M = {}
local session
local directory = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":h")

local function renderer_job()
  local id = vim.g.mkdp_node_channel_id
  if id and vim.api.nvim_get_chan_info(id).mode == "rpc" then
    return id
  end
end

local function finish(current)
  if session ~= current then
    return
  end
  session = nil
  if renderer_job() == current.renderer then
    vim.fn["mkdp#util#stop_preview"]()
  end
  for buf in pairs(current.buffers) do
    if vim.api.nvim_buf_is_valid(buf) then
      vim.b[buf].MarkdownPreviewToggleBool = 0
    end
  end
end

function M.open(url)
  local port, buf = url:match("^http://localhost:(%d+)/page/(%d+)$")
  if not port then
    port, buf = url:match("^http://127%.0%.0%.1:(%d+)/page/(%d+)$")
  end
  local renderer = renderer_job()
  if not port or not renderer then
    vim.notify("Could not identify the local Markdown preview server", vim.log.levels.ERROR)
    return
  end
  if session and session.renderer ~= renderer then
    vim.fn.jobstop(session.job)
    session = nil
  end
  if not session then
    local current = { renderer = renderer, buffers = {} }
    local partial = ""
    session = current
    current.job = vim.fn.jobstart({ "node", directory .. "/server.mjs", port, vim.fn.jobpid(renderer) }, {
      on_stdout = function(_, lines)
        if session ~= current then
          return
        end
        lines[1] = partial .. lines[1]
        partial = table.remove(lines)
        for _, line in ipairs(lines) do
          local open, buffer = line:match("^([01]) (%d+)$")
          buffer = tonumber(buffer)
          if buffer and current.buffers[buffer] and vim.api.nvim_buf_is_valid(buffer) then
            vim.b[buffer].MarkdownPreviewToggleBool = tonumber(open)
          elseif line:match("^http://127%.0%.0%.1:%d+/page/%d+$") then
            vim.ui.open(line)
          end
        end
      end,
      on_exit = function(_, code)
        if session == current and code ~= 0 and vim.v.exiting == vim.NIL then
          vim.notify("Markdown preview wrapper exited (" .. code .. ")", vim.log.levels.ERROR)
        end
        finish(current)
      end,
    })
    if current.job <= 0 then
      finish(current)
      vim.notify("Could not start Node.js for Markdown preview", vim.log.levels.ERROR)
      return
    end
  end
  session.buffers[tonumber(buf)] = true
  vim.fn.chansend(session.job, buf .. "\n")
end

return M
