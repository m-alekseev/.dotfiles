return {
  "iamcco/markdown-preview.nvim",
  init = function()
    vim.cmd([[
      function! DotfilesMarkdownPreview(url) abort
        call luaeval('require("markdown_preview").open(_A)', a:url)
      endfunction
    ]])
    vim.g.mkdp_browserfunc = "DotfilesMarkdownPreview"
  end,
}
