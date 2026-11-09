# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

plugins=(git extract vi-mode tmux fzf)

[[ -x /opt/homebrew/bin/brew ]] && eval "$(/opt/homebrew/bin/brew shellenv)"

case "$(uname)" in
  Darwin) source "$HOME/.dotfiles/zsh/macos-config.zsh" ;;
  Linux)  source /usr/share/cachyos-zsh-config/cachyos-config.zsh ;;
esac

export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init - --no-rehash zsh)"

export NVM_DIR="$HOME/.nvm"
path+=($NVM_DIR/versions/node/*/bin(N/On[1]))
nvm() {
  unfunction nvm
  local f
  for f in "$NVM_DIR/nvm.sh" /opt/homebrew/opt/nvm/nvm.sh; do
    [[ -s $f ]] && { . "$f"; break }
  done
  [[ -s $NVM_DIR/bash_completion ]] && . "$NVM_DIR/bash_completion"
  nvm "$@"
}

alias gis="git status"
alias vim="nvim"
alias vi="nvim"

function _proxied {
  zmodload -F zsh/net/tcp b:ztcp
  if ! ztcp localhost 12334 2>/dev/null; then
    print -u2 "$1: proxy localhost:12334 is not reachable"
    return 1
  fi
  ztcp -c $REPLY
  local p="http://localhost:12334" np="localhost,127.0.0.1,.dev002.local"
  HTTPS_PROXY=$p HTTP_PROXY=$p ALL_PROXY=$p https_proxy=$p http_proxy=$p all_proxy=$p \
    NO_PROXY=$np no_proxy=$np command "$@"
}

function claude   { _proxied claude "$@" }
function pi       { _proxied pi "$@" }
function agy      { _proxied agy "$@" }
function codex    { _proxied codex "$@" }
function opencode { _proxied opencode "$@" }
function cw       { CLAUDE_CONFIG_DIR=~/.claude-work command claude "$@" }
function cwp      { CLAUDE_CONFIG_DIR=~/.claude-work _proxied claude "$@" }
nr() { nvim -c "AgentReview $1"; }

# opencode
[[ -d $HOME/.opencode/bin ]] && export PATH=$HOME/.opencode/bin:$PATH

# Let node/require() find globally npm-installed packages from any directory
export NODE_PATH="$(npm root -g)"

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
# The following lines have been added by Docker Desktop to enable Docker CLI completions.
fpath=(/Users/user/.docker/completions $fpath)
autoload -Uz compinit
(( ${+_comps[docker]} )) || compinit
# End of Docker CLI completions


# Added by Antigravity CLI installer
export PATH="/Users/user/.local/bin:$PATH"
