local M = {}
local api = vim.api
local server = vim.fs.joinpath(debug.getinfo(1, "S").source:sub(2):match("^(.*)/"), "server.py")
local active

local function warn(message)
  vim.notify(message, vim.log.levels.WARN, { title = "Draw.io preview" })
end

local function stop()
  if not active then
    return
  end
  local session = active
  active = nil
  session.timer:close()
  api.nvim_del_augroup_by_id(session.group)
  vim.fn.chanclose(session.job, "stdin")
end

local function send(session)
  if active ~= session or not api.nvim_buf_is_loaded(session.buffer) then
    return
  end
  local xml = table.concat(api.nvim_buf_get_lines(session.buffer, 0, -1, false), "\n")
  vim.fn.chansend(session.job, vim.json.encode(xml) .. "\n")
end

local function open(url)
  local _, err = vim.ui.open(url)
  if err then
    warn(err)
  end
end

local function start()
  local buffer = api.nvim_get_current_buf()
  if not api.nvim_buf_get_name(buffer):lower():match("%.drawio$") then
    warn("Open a .drawio buffer first")
    return
  end
  if active and active.buffer == buffer then
    if active.url then
      open(active.url)
    end
    return
  end
  if vim.fn.executable("python3") == 0 then
    warn("python3 is required")
    return
  end

  stop()
  local session = { buffer = buffer }
  local output = ""
  session.job = vim.fn.jobstart({ "python3", "-B", server }, {
    on_stdout = function(_, data)
      if active ~= session then
        return
      end
      output = output .. table.concat(data, "\n")
      while true do
        local line, remaining = output:match("^([^\n]*)\n(.*)$")
        if not line then
          break
        end
        output = remaining
        if line == "tabs-closed" then
          stop()
          break
        end
        if line:match("^http://127%.0%.0%.1:%d+/[%w_%-]+/$") then
          session.url = line
          open(line)
        end
      end
    end,
    on_stderr = function(_, data)
      if active == session then
        session.error = vim.trim((session.error or "") .. "\n" .. table.concat(data, "\n"))
      end
    end,
    on_exit = function(_, code)
      if active == session then
        stop()
        warn(session.error and session.error ~= "" and session.error or ("Preview server exited (" .. code .. ")"))
      end
    end,
  })
  if session.job <= 0 then
    warn("Could not start the preview server")
    return
  end

  session.group = api.nvim_create_augroup("DrawioPreviewSession", { clear = true })
  session.timer = assert(vim.uv.new_timer())
  active = session
  api.nvim_create_autocmd({ "TextChanged", "TextChangedI", "TextChangedP", "BufWritePost" }, {
    group = session.group,
    buffer = buffer,
    callback = function()
      session.timer:start(250, 0, vim.schedule_wrap(function()
        send(session)
      end))
    end,
  })
  api.nvim_create_autocmd("BufUnload", { group = session.group, buffer = buffer, callback = stop })
  api.nvim_create_autocmd("VimLeavePre", { group = session.group, callback = stop })
  send(session)
end

function M.setup()
  api.nvim_create_user_command("DrawioPreview", start, { desc = "Open live draw.io preview" })
  api.nvim_create_user_command("DrawioPreviewStop", stop, { desc = "Stop live draw.io preview" })
end

return M
