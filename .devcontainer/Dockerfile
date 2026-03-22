FROM node:24-slim

WORKDIR /workspace

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libvips-dev \
    git \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    lsof \
    procps \
    awscli \
    && rm -rf /var/lib/apt/lists/*

# pnpm & corepack - package.jsonと同じバージョンを使用
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Node.jsのメモリ制限を緩和（Docker環境用）
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 環境変数（開発用途）
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/usr/local/pnpm
ENV PATH="$PNPM_HOME:$PATH"

# pnpmのストアディレクトリを固定
RUN mkdir -p /root/.pnpm-store
ENV PNPM_STORE_DIR=/root/.pnpm-store
RUN pnpm config set store-dir /root/.pnpm-store && \
    # ビルドスクリプト自動承認
    pnpm config set enable-pre-post-scripts true && \
    # 依存関係の自動インストール
    pnpm config set auto-install-peers true && \
    pnpm config set strict-peer-dependencies false && \
    # ホイスト設定
    pnpm config set shamefully-hoist true && \
    # ネイティブモジュールビルド承認
    pnpm config set ignore-scripts false

# 必要なディレクトリを作成
RUN mkdir -p /workspace/node_modules \
    /workspace/apps/frontend/node_modules \
    /workspace/apps/frontend/.next \
    /workspace/apps/backend/node_modules \
    /workspace/apps/worker/node_modules

# .npmrcをコピー
COPY .npmrc /workspace/

# zshのインストール（開発環境向け）
RUN apt-get update && apt-get install -y zsh && rm -rf /var/lib/apt/lists/*
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# デフォルトシェルをzshに変更
RUN chsh -s /bin/zsh root

# 作業ディレクトリを設定
WORKDIR /workspace

# コンテナ起動時のコマンド（docker-compose.ymlでsleep infinityを使用するため不要）
CMD ["zsh"]
