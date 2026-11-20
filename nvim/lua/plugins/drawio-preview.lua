return {
  name = "drawio-preview",
  dir = vim.fn.stdpath("config") .. "/lua/drawio_preview",
  cmd = { "DrawioPreview", "DrawioPreviewStop" },
  config = function()
    require("drawio_preview").setup()
  end,
}
