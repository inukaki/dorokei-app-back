# ドロケイアプリ - バックエンド

NestJS + TypeORM + MariaDB で構築されたドロケイゲームのバックエンドAPI

---

## 🚀 クイックスタート（Docker環境）

### 前提条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop) がインストールされていること
- [Git](https://git-scm.com/) がインストールされていること

---

### 3ステップで起動

#### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd dorokei-app-back
```

#### 2. 環境変数ファイルをコピー

```bash
cp .env.example .env
```

💡 `.env`ファイルの内容は必要に応じて編集してください（通常はデフォルトで動作します）

#### 3. Docker Composeで起動

```bash
docker-compose up -d
```

このコマンドで以下が自動的に実行されます：

- ✅ MariaDBコンテナの起動
- ✅ バックエンドコンテナのビルドと起動
- ✅ データベースの初期化
- ✅ NestJSアプリケーションの起動（ホットリロード有効）

#### 4. マイグレーション実行（初回のみ）

```bash
docker exec -it dorokei-backend npm run migration:run
```

---

## ✅ 起動確認

### 1. Dockerコンテナの状態確認

```bash
docker-compose ps
```

**期待される出力:**
```
NAME                IMAGE                    STATUS                    PORTS
dorokei-backend     dorokei-app-backend      Up 2 minutes              0.0.0.0:3000->3000/tcp
dorokei-mariadb     mariadb:10.11.10         Up 2 minutes              0.0.0.0:3306->3306/tcp
```

✅ 両方とも`Up`になっていればOK

---

### 2. テーブルの確認

```bash
docker exec -it dorokei-mariadb mariadb -u root -p -e "USE dorokei_db; SHOW TABLES;"
```

パスワード: .envファイルで設定した`DB_ROOT_PASSWORD`を入力


**期待される出力:**
```
+----------------------+
| Tables_in_dorokei_db |
+----------------------+
| migrations           |
| players              |
| rooms                |
+----------------------+
```

### データベース操作

```bash
# MariaDBに接続（root）
docker exec -it dorokei-mariadb mariadb -u root -p
# パスワード: .envファイルで設定した`DB_ROOT_PASSWORD`を入力
```

**SQL実行例:**
```sql
USE dorokei_db;
SHOW TABLES;
SELECT * FROM rooms;
SELECT * FROM players;
```

---
