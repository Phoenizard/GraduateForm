# Fork 后部署升学站

升学站（`site/`）是自包含的静态项目：数据冻结在仓库、构建离线、workflow 不依赖任何 Secret。Fork 后按以下步骤部署到你自己账户名下的 GitHub Pages。

## 1. 启用 Actions

Fork 来的仓库默认禁用 Actions（GitHub 安全策略）。进入你的 fork：
**Settings → Actions → General → Actions permissions → 选 "Allow all actions and reusable workflows" → Save。**

## 2. 改模板里的仓库地址

编辑 `site/templates/mkdocs.jinja` 顶部，把 `Phoenizard` / `GraduateForm` 换成你自己的 GitHub 用户名与仓库名：

```yaml
site_url: https://<你的用户名>.github.io/<你的仓库名>/
repo_name: <你的用户名>/<你的仓库名>
repo_url: https://github.com/<你的用户名>/<你的仓库名>/
```

指向原仓库的地址仅集中在这一个文件，可用以下命令确认已全部替换：

```bash
grep -rn "Phoenizard\|phoenizard" site/templates/
```

## 3. 触发构建

把上述改动 push 到你 fork 的 `main` 分支（改动落在 `site/**`，会自动触发），或到
**Actions → publish-site → Run workflow** 手动触发一次。

Workflow 会离线构建并用 `mkdocs gh-deploy --force` 把成品推到 **`gh-pages` 分支**。

## 4. 开启 GitHub Pages

首次部署后，`gh-pages` 分支才会出现。然后：
**Settings → Pages → Source 选 "Deploy from a branch" → Branch 选 `gh-pages` / `(root)` → Save。**

等一两分钟，站点上线于 **https://<你的用户名>.github.io/<你的仓库名>/**。

## 更新内容

若要改文章、模板或资源，编辑 `site/` 下对应文件并 push，Action 会自动重建部署。若要换成你自己的一批数据，替换 `site/data/frozen/` 的 4 个 JSON。
