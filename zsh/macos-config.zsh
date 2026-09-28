# Herdr resets TERM to xterm-256color, losing Ghostty's undercurl (Smulx) capability
[[ -n "$HERDR_ENV" ]] && export TERM=xterm-ghostty

export ZSH="$HOME/.oh-my-zsh"
source $ZSH/oh-my-zsh.sh

# Don't add certain commands to the history file.
export HISTORY_IGNORE="(\&|[bf]g|c|clear|history|exit|q|pwd|* --help)"

# Use custom `less` colors for `man` pages.
export LESS_TERMCAP_md="$(tput bold 2> /dev/null; tput setaf 2 2> /dev/null)"
export LESS_TERMCAP_me="$(tput sgr0 2> /dev/null)"

source "$HOMEBREW_PREFIX/share/powerlevel10k/powerlevel10k.zsh-theme"

# Fish-like syntax highlighting and autosuggestions
source "$HOMEBREW_PREFIX/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
source "$HOMEBREW_PREFIX/share/zsh-autosuggestions/zsh-autosuggestions.zsh"

# Use history substring search
source "$HOMEBREW_PREFIX/share/zsh-history-substring-search/zsh-history-substring-search.zsh"

export FZF_BASE="$HOMEBREW_PREFIX/opt/fzf"
