return {
	"m-alekseev/agentreview.nvim",
	opts = { transport = "herdr" },
	cmd = { "AgentReview", "AgentReviewComment", "AgentReviewSend", "AgentReviewTarget" },
	keys = {
		{ "<leader>r", "<cmd>AgentReview<cr>", desc = "Agent review" },
		{ "<leader>rt", "<cmd>AgentReviewTarget<cr>", desc = "Agent review target" },
		{ "<leader>rs", "<cmd>AgentReviewSend<cr>", desc = "Agent review send" },
	},
}
