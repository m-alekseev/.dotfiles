local M = {}
local server = vim.fs.joinpath(debug.getinfo(1, "S").source:sub(2):match("^(.*)/"), "server.mjs")
local sessions = {}

function M.open(buf)
  local file = vim.api.nvim_buf_get_name(buf)
  if file == "" or vim.fn.filereadable(file) == 0 then
    vim.notify("Save the D2 file before previewing", vim.log.levels.WARN)
    return
  end
  local function open(session)
    if session.url then
      local _, err = vim.ui.open(session.url)
      if err then
        vim.fn.jobstop(session.job)
        vim.notify(err, vim.log.levels.ERROR)
      end
    end
  end
  if sessions[file] then
    open(sessions[file])
    return
  end

  local session = { output = "" }
  session.job = vim.fn.jobstart({ "node", server, file }, {
    on_stdout = function(_, data)
      session.output = session.output .. table.concat(data, "\n")
      if not session.url then
        session.url = session.output:match("^(http://127%.0%.0%.1:%d+/[%w%-]+/)\n")
        open(session)
      end
    end,
    stderr_buffered = true,
    on_stderr = function(_, data)
      session.error = vim.trim(table.concat(data, "\n"))
    end,
    on_exit = function(_, code)
      sessions[file] = nil
      if code ~= 0 then
        vim.notify(session.error ~= "" and session.error or "D2 preview exited", vim.log.levels.ERROR)
      end
    end,
  })
  if session.job > 0 then
    sessions[file] = session
  else
    vim.notify("Could not start Node.js for the D2 preview", vim.log.levels.ERROR)
  end
end

return M
