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

alias cw='CLAUDE_CONFIG_DIR=~/.claude-work claude'
alias cwp='HTTPS_PROXY="http://localhost:12334" NO_PROXY="localhost,127.0.0.1,.dev002.local" CLAUDE_CONFIG_DIR=~/.claude-work command claude'
alias claude='HTTPS_PROXY="http://localhost:12334" NO_PROXY="localhost,127.0.0.1,.dev002.local" command claude'
alias pi='HTTPS_PROXY="http://localhost:12334" NO_PROXY="localhost,127.0.0.1,.dev002.local" command pi'

# opencode
[[ -d /home/user/.opencode/bin ]] && export PATH=/home/user/.opencode/bin:$PATH
alias opencode='HTTPS_PROXY="http://localhost:12334" NO_PROXY="localhost,127.0.0.1,.dev002.local" command opencode'

# Let node/require() find globally npm-installed packages from any directory
export NODE_PATH="$(npm root -g)"

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
# The following lines have been added by Docker Desktop to enable Docker CLI completions.
fpath=(/Users/user/.docker/completions $fpath)
autoload -Uz compinit
(( ${+_comps[docker]} )) || compinit
# End of Docker CLI completions
