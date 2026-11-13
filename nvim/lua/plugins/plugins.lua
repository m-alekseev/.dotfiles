return {
	{
		"chomosuke/typst-preview.nvim",
		lazy = false, -- or ft = 'typst'
		version = "1.*",
		opts = {}, -- lazy.nvim will implicitly calls `setup {}`
	},
	{
		"folke/snacks.nvim",
		opts = {
			indent = {
				enabled = false, -- disable indent lines by default
			},
			terminal = {
				win = {
					keys = {
						clear_terminal = {
							"<M-l>",
							function()
								vim.api.nvim_chan_send(vim.bo.channel, "\x0c")
							end,
							mode = "t",
							desc = "Clear",
						},
					},
				},
			},
			-- explorer = {
			-- 	enabled = false,
			-- },
		},
	},
	{
		"stevearc/oil.nvim",
		---@module 'oil'
		---@type oil.SetupOpts
		opts = {
			default_file_explorer = false,
			view_options = {
				show_hidden = true,
			},
			-- keymaps = {
			-- 	["q"] = "actions.close",
			-- },
		},
		keys = {
			{
				"<leader>-",
				function()
					require("oil").open()
				end,
				desc = "Open Oil explorer",
			},
			-- {
			-- 	"<leader>e",
			-- 	function()
			-- 		require("oil").open()
			-- 	end,
			-- 	desc = "open oil explorer",
			-- },
		},
		-- Optional dependencies
		-- dependencies = { { "nvim-mini/mini.icons", opts = {} } },
		dependencies = { "nvim-tree/nvim-web-devicons" }, -- use if you prefer nvim-web-devicons
		-- Lazy loading is not recommended because it is very tricky to make it work correctly in all situations.
		lazy = false,
	},
	{
		"folke/which-key.nvim",
		opts = {
			preset = "modern",
		},
	},
	{
		"saghen/blink.cmp",
		opts = {
			sources = {
				providers = {
					snippets = {
						enabled = false,
					},
					buffer = {
						enabled = true,
						max_items = 5,
						min_keyword_length = 3,
						opts = {
							get_bufnrs = function()
								return vim.tbl_filter(function(bufnr)
									return vim.bo[bufnr].buftype == ""
								end, vim.api.nvim_list_bufs())
							end,
						},
					},
				},
			},
			keymap = {
				-- preset = "super-tab",
				["<C-Space>"] = { "show", "show_documentation", "hide_documentation" },
				["<C-e>"] = { "hide", "fallback" },
				["<Tab>"] = {
					function(cmp)
						if cmp.snippet_active() then
							return cmp.accept()
						else
							return cmp.select_and_accept()
						end
					end,
					"snippet_forward",
					"fallback",
				},
				["<S-Tab>"] = { "snippet_backward", "fallback" },
				["<C-j>"] = { "select_next", "fallback" },
				["<C-k>"] = { "select_prev", "fallback" },
				["<C-u>"] = { "scroll_documentation_up", "fallback" },
				["<C-d>"] = { "scroll_documentation_down", "fallback" },
			},
		},
	},
	{
		"nvim-lualine/lualine.nvim",
		-- dependencies = { { "nvim-mini/mini.icons", opts = {} } },
		dependencies = { "nvim-tree/nvim-web-devicons" },
		opts = {
			options = {
				-- nvim vague theme support for lualine
				theme = {
					normal = {
						a = { bg = "#6e94b2", fg = "#1c1c24", gui = "bold" },
						b = { bg = "#252530", fg = "#cdcdcd" },
						c = { bg = "#1c1c24", fg = "#cdcdcd" },
					},
					insert = {
						a = { bg = "#7fa563", fg = "#1c1c24", gui = "bold" },
						b = { bg = "#252530", fg = "#cdcdcd" },
						c = { bg = "#1c1c24", fg = "#cdcdcd" },
					},
					visual = {
						a = { bg = "#bb9dbd", fg = "#1c1c24", gui = "bold" },
						b = { bg = "#252530", fg = "#cdcdcd" },
						c = { bg = "#1c1c24", fg = "#cdcdcd" },
					},
					replace = {
						a = { bg = "#d8647e", fg = "#1c1c24", gui = "bold" },
						b = { bg = "#252530", fg = "#cdcdcd" },
						c = { bg = "#1c1c24", fg = "#cdcdcd" },
					},
					command = {
						a = { bg = "#f3be7c", fg = "#1c1c24", gui = "bold" },
						b = { bg = "#252530", fg = "#cdcdcd" },
						c = { bg = "#1c1c24", fg = "#cdcdcd" },
					},
					inactive = {
						a = { bg = "#1c1c24", fg = "#606079" },
						b = { bg = "#1c1c24", fg = "#606079" },
						c = { bg = "#1c1c24", fg = "#606079" },
					},
				},
			},
			sections = {
				lualine_z = {},
			},
		},
	},
	{
		"terrastruct/d2-vim",
		ft = { "d2" },
		config = function()
			local function set_preview_keymap(buf)
				vim.keymap.set("n", "<leader>d2", function()
					local file = vim.api.nvim_buf_get_name(buf)
					if file == "" then
						vim.notify("Save the D2 file before previewing", vim.log.levels.WARN)
						return
					end
					vim.cmd("botright new")
					vim.fn.jobstart({ "d2", "--watch", file }, { term = true })
					vim.cmd("startinsert")
				end, { buffer = buf, desc = "D2 browser preview" })
			end
			vim.api.nvim_create_autocmd("FileType", {
				group = vim.api.nvim_create_augroup("d2_browser_preview", { clear = true }),
				pattern = "d2",
				callback = function(event)
					set_preview_keymap(event.buf)
				end,
			})
			set_preview_keymap(vim.api.nvim_get_current_buf())
		end,
	},
	{
		"folke/noice.nvim",
		opts = {
			presets = {
				lsp_doc_border = true,
			},
			cmdline = {
				enabled = false,
			},
		},
	},
	-- To disable semanticTokensProvider which makes colors dimmer after a few seconds after opening a buffer
	-- {
	-- 	"neovim/nvim-lspconfig",
	-- 	opts = {
	-- 		setup = {
	-- 			["*"] = function(_, opts)
	-- 				local on_attach = opts.on_attach
	-- 				opts.on_attach = function(client, bufr)
	-- 					if on_attach then
	-- 						on_attach(client, bufr)
	-- 					end
	-- 					client.server_capabilities.semanticTokensProvider = nil
	-- 				end
	-- 			end,
	-- 		},
	-- 	},
	-- },
}
