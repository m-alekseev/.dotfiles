return {
	"coder/claudecode.nvim",
	lazy = false,
	dependencies = { "folke/snacks.nvim" },
	config = true,
	cmd = {
		"ClaudeCode",
		"ClaudeCodeFocus",
		"ClaudeCodeSelectModel",
		"ClaudeCodeAdd",
		"ClaudeCodeSend",
		"ClaudeCodeTreeAdd",
		"ClaudeCodeStatus",
		"ClaudeCodeStart",
		"ClaudeCodeStop",
		"ClaudeCodeOpen",
		"ClaudeCodeClose",
		"ClaudeCodeDiffAccept",
		"ClaudeCodeDiffDeny",
		"ClaudeCodeCloseAllDiffs",
	},
	keys = {
		{ "<leader>a", nil, desc = "AI/Claude Code" },
		{ "<leader>ac", "<cmd>ClaudeCode<cr>", desc = "Toggle Claude" },
		{ "<M-c>", "<cmd>ClaudeCode<cr>", mode = { "n", "i", "t", "v" }, desc = "Toggle Claude" },
		{ "<leader>af", "<cmd>ClaudeCodeFocus<cr>", desc = "Focus Claude" },
		{ "<leader>ar", "<cmd>ClaudeCode --resume<cr>", desc = "Resume Claude" },
		{ "<leader>aC", "<cmd>ClaudeCode --continue<cr>", desc = "Continue Claude" },
		{ "<leader>am", "<cmd>ClaudeCodeSelectModel<cr>", desc = "Select Claude model" },
		{ "<leader>ab", "<cmd>ClaudeCodeAdd %<cr>", desc = "Add current buffer" },
		{ "<leader>as", "<cmd>ClaudeCodeSend<cr>", mode = "v", desc = "Send to Claude" },
		{
			"<leader>as",
			"<cmd>ClaudeCodeTreeAdd<cr>",
			desc = "Add file",
			ft = { "NvimTree", "neo-tree", "oil", "minifiles", "netrw", "snacks_picker_list" },
		},
		-- Diff management
		{ "<leader>aa", "<cmd>ClaudeCodeDiffAccept<cr>", desc = "Accept diff" },
		{ "<leader>ad", "<cmd>ClaudeCodeDiffDeny<cr>", desc = "Deny diff" },
	},
	opts = function(_, opts)
		local env_file = vim.fn.stdpath("config") .. "/lua/plugins/.env"
		local env_vars = {}

		if vim.fn.filereadable(env_file) == 1 then
			for line in io.lines(env_file) do
				local key, val = line:match("^%s*([%w_]+)%s*=%s*(.+)$")
				if key then
					env_vars[key] = val
				end
			end
		end

		opts.env = {
			HTTPS_PROXY = env_vars.HTTPS_PROXY,
			HTTP_PROXY = env_vars.HTTP_PROXY,
			ALL_PROXY = env_vars.ALL_PROXY,
			-- CLAUDE_CONFIG_DIR = env_vars.CLAUDE_CONFIG_DIR,
		}
		opts.terminal_cmd = "claude"

		local idle_width_pct = 0.4
		local diff_width_pct = 0.2

		opts.terminal = {
			provider = "none",
			split_width_percentage = idle_width_pct,
			snacks_win_opts = {
				-- position = "float",
				position = "right",
				border = "single",
				width = idle_width_pct,
				-- width = 0.9,
				-- height = 0.9,
				keys = {
					normal_mode = {
						"<M-n>",
						function()
							vim.api.nvim_feedkeys(
								vim.api.nvim_replace_termcodes("<C-\\><C-n>", true, false, true),
								"t",
								false
							)
						end,
						mode = "t",
						desc = "Normal mode",
					},
				},
			},
		}
		opts.diff_opts = {
			layout = "vertical",
			open_in_new_tab = true,
			keep_terminal_focus = false, -- If true, moves focus back to terminal after diff opens
			hide_terminal_in_new_tab = false,
			auto_resize_terminal = false, -- own terminal width via the User autocmds below
		}

		local function find_claude_terminal_win()
			local ok, terminal = pcall(require, "claudecode.terminal")
			if not ok then
				return nil
			end
			local bufnr = terminal.get_active_terminal_bufnr()
			if not bufnr then
				return nil
			end
			local win = vim.fn.bufwinid(bufnr)
			return win ~= -1 and win or nil
		end

		local diff_layout_group = vim.api.nvim_create_augroup("ClaudeCodeDiffLayout", { clear = true })

		vim.api.nvim_create_autocmd("User", {
			pattern = "ClaudeCodeDiffOpened",
			group = diff_layout_group,
			callback = function(ev)
				local term = ev.data.terminal_window
				if term and vim.api.nvim_win_is_valid(term) then
					vim.api.nvim_win_set_width(term, math.floor(vim.o.columns * diff_width_pct))
				end

				local target, diff = ev.data.target_window, ev.data.diff_window
				if target and diff and vim.api.nvim_win_is_valid(target) and vim.api.nvim_win_is_valid(diff) then
					local total = vim.api.nvim_win_get_width(target) + vim.api.nvim_win_get_width(diff)
					local half = math.floor(total / 2)
					vim.api.nvim_win_set_width(target, half)
					vim.api.nvim_win_set_width(diff, total - half)
				end
			end,
		})

		vim.api.nvim_create_autocmd("User", {
			pattern = "ClaudeCodeDiffClosed",
			group = diff_layout_group,
			callback = function()
				local term = find_claude_terminal_win()
				if term then
					vim.api.nvim_win_set_width(term, math.floor(vim.o.columns * idle_width_pct))
				end
			end,
		})

		return opts
	end,
}
