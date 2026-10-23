return {
	"m-alekseev/agentreview.nvim",
	opts = { transport = "herdr" },
	cmd = { "AgentReview", "AgentReviewCommit", "AgentReviewComment", "AgentReviewSend", "AgentReviewTarget" },
	keys = {
		{ "<leader>rr", "<cmd>AgentReview<cr>", desc = "Agent review" },
		{ "<leader>rh", "<cmd>AgentReviewCommit<cr>", desc = "Agent review commit" },
		{ "<leader>rt", "<cmd>AgentReviewTarget<cr>", desc = "Agent review target" },
		{ "<leader>rs", "<cmd>AgentReviewSend<cr>", desc = "Agent review send" },
	},
}
