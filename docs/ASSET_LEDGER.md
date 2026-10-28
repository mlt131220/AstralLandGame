# 美术资源授权台账

游戏用到的每批美术、音频与字体资源的来源、许可和用途。第三方素材均为 CC0 1.0（Kenney、OpenGameArt）或 SIL OFL 1.1（霞鹜文楷），其余为本项目原创。表中的 `assets-src/...` 是开发时原始素材包与建模脚本在本地的位置，未放进仓库；运行时实际用到的文件都在 `public/assets`。

| 资源 | 来源 | 许可 | 用途 |
|---|---|---|---|

<!-- job1-buildings -->

## 建筑与大型结构（任务 1）

| 资源 | 来源 | 许可 | 用途 |
|---|---|---|---|
| fantasy-town-kit：`banner-green.glb`、`wall-door.glb`、`wall-window-glass.glb`、`wall-wood-door.glb`、`wall-wood-window-shutters.glb`、`wall-wood.glb`、`wall.glb`、`windmill.glb`；`Textures/colormap.png` | 本地 `assets-src/vendor/kenney/fantasy-town-kit/`；Kenney；套件内 `License.txt` | CC0 1.0 | 建筑墙体、门窗、风车叶片和生活装饰 |
| food-kit：`bowl-soup.glb`、`cabbage.glb`、`carrot.glb`；`Textures/colormap.png` | 本地 `assets-src/vendor/kenney/food-kit/`；Kenney；套件内 `License.txt` | CC0 1.0 | 建筑墙体、门窗、风车叶片和生活装饰 |
| graveyard-kit：`hay-bale.glb`；`Textures/colormap.png` | 本地 `assets-src/vendor/kenney/graveyard-kit/`；Kenney；套件内 `License.txt` | CC0 1.0 | 建筑墙体、门窗、风车叶片和生活装饰 |
| survival-kit：`barrel-open.glb`、`barrel.glb`、`box-open.glb`、`box.glb`、`bucket.glb`、`resource-planks.glb`、`resource-wood.glb`、`workbench-anvil.glb`、`workbench.glb`；`Textures/colormap.png` | 本地 `assets-src/vendor/kenney/survival-kit/`；Kenney；套件内 `License.txt` | CC0 1.0 | 建筑墙体、门窗、风车叶片和生活装饰 |
| 屋顶瓦面、木构门廊、谷仓、风车塔身及三态施工结构、井栏、布告板、信箱、出货箱、建筑补充调色板 | 本项目 Blender 脚本程序化建模 | 项目自制，无第三方素材 | 补齐建筑轮廓与功能细节 |
| 物品储物箱 | Kenney Survival Kit：`chest`；`assets-src/vendor/kenney/survival-kit/License.txt` | CC0 1.0 | 储物箱 GLB、储物箱图标 |
| 木材、石料图标 | Kenney Survival Kit：`resource-wood`、`resource-stone`；同套件 License.txt | CC0 1.0 | 资源图标 |
| 救济清汤图标 | Kenney Food Kit：`bowl-soup` 及其嵌入调色板；`assets-src/vendor/kenney/food-kit/License.txt` | CC0 1.0 | 清汤图标 |
| 28 种五阶段作物、28 种产物与种子袋、堆肥箱、稻草人、20 件农具、草绳、肥料袋 | 本任务 Blender 程序化原创；`assets-src/blender/crops/geometry.py` | 原创项目资源，无第三方素材限制 | 正式模型、产物与种子及工具图标 |

<!-- job1-buildings:13f50ea63374 -->

## 建筑与大型结构（任务 1，当前交付用料）

| 资源 | 来源 | 许可 | 用途 |
|---|---|---|---|
| fantasy-town-kit：`banner-green.glb`、`wall-door.glb`、`wall-window-glass.glb`、`wall-wood-door.glb`、`wall-wood-window-shutters.glb`、`wall-wood.glb`、`wall.glb`、`windmill.glb`；`Textures/colormap.png` | 本地 `assets-src/vendor/kenney/fantasy-town-kit/`；Kenney；套件内 `License.txt` | CC0 1.0 | 建筑墙体、门窗、风车叶片和生活装饰 |
| food-kit：`bowl-soup.glb`、`cabbage.glb`、`carrot.glb`；`Textures/colormap.png` | 本地 `assets-src/vendor/kenney/food-kit/`；Kenney；套件内 `License.txt` | CC0 1.0 | 建筑墙体、门窗、风车叶片和生活装饰 |
| graveyard-kit：`hay-bale.glb`；`Textures/colormap.png` | 本地 `assets-src/vendor/kenney/graveyard-kit/`；Kenney；套件内 `License.txt` | CC0 1.0 | 建筑墙体、门窗、风车叶片和生活装饰 |
| survival-kit：`box.glb`、`resource-planks.glb`、`resource-wood.glb`、`workbench-anvil.glb`、`workbench.glb`；`Textures/colormap.png` | 本地 `assets-src/vendor/kenney/survival-kit/`；Kenney；套件内 `License.txt` | CC0 1.0 | 建筑墙体、门窗、风车叶片和生活装饰 |
| 屋顶瓦面、木构门廊、谷仓、风车塔身及三态施工结构、井栏与木桶、布告板、信箱、出货箱、建筑补充调色板 | 本项目 Blender 脚本程序化建模 | 项目自制，无第三方素材 | 补齐建筑轮廓与功能细节；首轮尝试的金属桶已替换为自制木桶 |

## 运行时直接引用的第三方素材（主线程接入）

| 资源 | 来源 | 许可 | 用途 |
|---|---|---|---|
| Nature Kit、Survival Kit、Fantasy Town Kit 2.0、Graveyard Kit、Holiday Kit、Food Kit 全部 GLB 与 `Textures/colormap.png` | Kenney（kenney.nl，下载链接见 `assets-src/vendor/kenney/urls.txt`），套件内 `License.txt` | CC0 1.0 | 树木、岩石、杂草、草丛、野花、睡莲、耕地垄、围栏、树篱、路灯、灯笼、长椅、摊位、喷泉、木桶、木箱、干草等场景物件（登记表 `src/render/models.ts`） |
| Mini Characters（12 个角色 + 32 段动画） | Kenney，套件内 `License.txt` | CC0 1.0 | 玩家与 NPC 模型、动画；外观选择预览图 |
| Cube Pets | Kenney，套件内 `License.txt` | CC0 1.0 | 动物（G2 起使用） |
| UI Pack Adventure（PNG Double） | Kenney，套件内 `License.txt` | CC0 1.0 | 面板、按钮、挂幅标题、物品格九宫格皮肤 |
| RPG Audio、Impact Sounds、Interface Sounds、Music Jingles | Kenney，套件内 `License.txt` | CC0 1.0 | 脚步、锄地、伐木、挖矿、界面、升级与日结音效（映射见 `assets-src/tools/sync_assets.py`） |
| 40 CC0 water / splash / slime SFX | OpenGameArt `content/40-cc0-water-splash-slime-sfx` | CC0 1.0 | 浇水溅水、雨声循环 |
| JRPG Pack 4 Calm（A Place I Call Home、Childhood Friends、Summer Memories、Innocence） | SubspaceAudio，OpenGameArt `content/jrpg-pack-4-calm` | CC0 1.0 | 标题与四季农场背景音乐 |
| Apple Cider | Zane Little，OpenGameArt `content/apple-cider` | CC0 1.0 | 秋季背景音乐 |
| Town Theme RPG | cynicmusic，OpenGameArt `content/town-theme-rpg` | CC0 1.0 | 小镇背景音乐 |
| Medieval: Market Day | RandomMind，OpenGameArt `content/medieval-market-day` | CC0 1.0 | 集市音乐（节庆备用） |
| Sunset Plains | Yoiyami，OpenGameArt `content/sunset-plains` | CC0 1.0 | 黄昏音乐 |
| A Small Fire Will Do (Calming Loop) | trex0n，OpenGameArt `content/a-small-fire-will-do-calming-loop` | CC0 1.0 | 夜晚音乐 |
| Forest Ambience | tinyworlds，OpenGameArt `content/forest-ambience` | CC0 1.0 | 农场白天环境音 |
| 霞鹜文楷 LXGW WenKai Medium v1.522 | github.com/lxgw/LxgwWenKai，`public/assets/fonts/OFL-LXGWWenKai.txt` | SIL OFL 1.1（仅为网页投放子集化，保留字体名） | 全部界面文字 |

发布前复核：逐项确认来源页许可未变更；CC0 素材不强制署名，但在制作人员名单中致谢 Kenney 与上列作者。
| 任务 5：28 种新版种子图标（缩微产物与分类散籽） | 本项目 Blender 原创造型；`assets-src/blender/crops/geometry.py` 的 `seed_display`，复用原创 `produce`；旧版备份来自任务开始时本地 PNG | 原创项目资源，无新增第三方素材 | 替换种子袋图标，保留新旧对比 |
| 任务 5：24 个 G2 物品图标、16 个物品 GLB（含熔炉点火状态） | 本项目 Blender 程序化原创；`assets-src/blender/crops/geometry_g2.py`、`g2-items.json`；复用既有相机、灯光与顶点色流程，未下载新素材 | 原创项目资源，无第三方素材限制 | 背包、腰包、四种鱼、矿物、采集物、补给、短剑、钓竿、熔炉与烘干架 |

<!-- job5-icons-items -->

## 种子与 G2 物品（任务 5）

| 资源 | 来源 | 许可 | 用途 |
| --- | --- | --- | --- |
| 任务 5：28 种新版种子图标（缩微产物与分类散籽） | 本项目 Blender 原创造型；`assets-src/blender/crops/geometry.py` 的 `seed_display`，复用原创 `produce`；旧版备份来自任务开始时本地 PNG | 原创项目资源，无新增第三方素材 | 替换种子袋图标，保留新旧对比 |
| 任务 5：24 个 G2 物品图标、16 个物品 GLB（含熔炉点火状态） | 本项目 Blender 程序化原创；`assets-src/blender/crops/geometry_g2.py`、`g2-items.json`；复用既有相机、灯光与顶点色流程，未下载新素材 | 原创项目资源，无第三方素材限制 | 背包、腰包、四种鱼、矿物、采集物、补给、短剑、钓竿、熔炉与烘干架 |


<!-- job6-g2-world -->

## G2 场景、生物与公共工程（任务 6）

| 资源 | 来源 | 许可 | 用途 |
| --- | --- | --- | --- |
| 40 个 G2 模型：苔石浅矿 16 件、敌人与鸡 4 件、动物用品 2 件、河岸浅林 8 件、水闸三态、花种会 7 件 | 本项目 Blender 程序化原创；`assets-src/blender/g2/shapes.py`；复用本项目 `assets-src/blender/crops/geometry.py` 的原创网格工具和既有建筑配色 | 项目自制，无新增第三方美术素材 | `public/assets/models/g2/` 正式 GLB；平直顶点色自包含，无外部贴图 |
| 苔团 6 段、土甲虫 7 段、母鸡与小鸡各 5 段刚体层级动画 | 本项目原创；`assets-src/blender/g2/motions.py`、`generate.py`；复用本项目 `characters/glb_io.py` 的 GLB 二进制工具 | 项目自制，无第三方动作数据 | 30fps 动作、蓄力/跳扑关键事件、接地校正与预览 |

本任务未下载新素材，未复制 Kenney 网格、贴图或动作；Kenney 仅为简报指定的低多边形风格参考。预览标注使用本机微软雅黑/黑体栅格化，不分发字体文件。


<!-- job4-character-tools -->

## 角色手部挂点与农务动画（任务 4）

| 资源 | 来源 | 许可 | 用途 |
|---|---|---|---|
| 12 个 Mini Characters 角色、原有 32 段动画及 colormap.png | 本地 `assets-src/vendor/kenney/mini-characters/`；Kenney；套件内 `License.txt` | CC0 1.0 | 原网格、骨骼、材质、动画无损保留，贴图嵌入正式角色 GLB |
| hand-r / hand-l 与 13 段农务、钓鱼、进食、捧物动画 | 本项目 `assets-src/blender/characters/` Blender 制作与采样脚本 | 项目自制，无新增第三方素材 | 正式角色、命中清单、关键帧与 12 外观握持预览 |
| 预览中的基础锄头及工具兼容性检查 | 已有 `public/assets/models/items/tool_*_*.glb`；任务 2 原创项目资源 | 项目自制 | 挂点和握持验证；不重复导入角色交付文件 |


<!-- job7-g2-audio -->

## G2 音频交付（任务 7）

新增 15 个音效键，每键 3 个独立文件，共 45 个变体；新增 6 个音乐／环境键。全部来源采用 **CC0 1.0**，未使用 CC-BY-SA、CC-BY-NC 或授权不明素材。授权复核日期：2026-10-14。

### 新下载的源文件

| 本目录文件 | 作者 | 来源与许可 | 用途 |
| --- | --- | --- | --- |
| `assets-src/vendor/oga/g2/raw/whoosh.wav`（附件原名 `whoosh2_0.wav`） | pyranostudios | [Air whoosh](https://opengameart.org/content/air-whoosh)，CC0 1.0 | 挥剑、甩竿；从原循环的不同位置取段、提速 |
| `assets-src/vendor/oga/g2/raw/insect.flac`（附件原名 `insectoralien.flac`） | qubodup | [Insect or alien scream](https://opengameart.org/content/insect-or-alien-scream)，CC0 1.0 | 取短促摩擦段、低通并叠加刮擦，制作土甲虫声 |
| `assets-src/vendor/oga/g2/raw/chicken-preview.ogg` | Breviceps | [Chicken clucking](https://freesound.org/people/Breviceps/sounds/456803/)，CC0 1.0 | 公开 OGG 预览源，原录音为 16 kHz 单声道；截取三段轻咕咕，避开长叫 |
| `assets-src/vendor/oga/g2/raw/caveexplorer_hq.mp3` | mutantleg | [Cave explorer](https://opengameart.org/content/cave-explorer)，CC0 1.0 | 舒缓、低沉的矿洞探索音乐 |
| `assets-src/vendor/oga/g2/raw/dungeon_ambient.ogg`（附件原名 `dungeon_ambient_1_0.ogg`） | JaggedStone | [Loopable Dungeon Ambience](https://opengameart.org/content/loopable-dungeon-ambience)，CC0 1.0 | 洞穴低频风声与滴水 |

下载直链、字节数和 SHA-256 见 `assets-src/vendor/oga/g2/downloads.json`。`assets-src/vendor/oga/g2/licenses/` 保存上述来源页及复用 OGA 来源页的授权快照；使用 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)。鸡叫采用公开预览文件，并未将其标为原始 WAV。

### 逐键文件、作者、来源与用途

下表中的 `sfx/键_{0,1,2}.ogg` 明确代表三个文件（编号 0、1、2），相对于 `public/assets/audio/`。Kenney 原始文件均来自既有 `assets-src/vendor/kenney/`，包内 `License.txt` 已核实；OGA 复用源位于既有 `assets-src/vendor/oga/`，没有重复下载。

| 键 | 运行时文件 | 具体原料与作者／来源 | 许可 | 取得方式与用途 |
| --- | --- | --- | --- | --- |
| `swing` | `sfx/swing_{0,1,2}.ogg` | pyranostudios，[Air whoosh](https://opengameart.org/content/air-whoosh)，`assets-src/vendor/oga/g2/raw/whoosh.wav` | CC0 1.0 | 新下载后剪辑、提速；短剑破风 |
| `hit` | `sfx/hit_{0,1,2}.ogg` | Kenney，[Impact Sounds](https://kenney.nl/assets/impact-sounds)，`impactPunch_medium_000/001/002.ogg` | CC0 1.0 | 复用；剑击命中 |
| `hurt` | `sfx/hurt_{0,1,2}.ogg` | Kenney，[Impact Sounds](https://kenney.nl/assets/impact-sounds)，`impactSoft_heavy_000/001/002.ogg` | CC0 1.0 | 复用；玩家受伤闷击，无人声 |
| `enemy_die` | `sfx/enemy_die_{0,1,2}.ogg` | Kenney，[Impact Sounds](https://kenney.nl/assets/impact-sounds) 的 `impactSoft_heavy_000/001/002`、`impactMining_000/001/002`，以及 [RPG Audio](https://kenney.nl/assets/rpg-audio) 的 `cloth1/2/3` | CC0 1.0 | 复用并分层混音；倒地、尘土消散 |
| `slime` | `sfx/slime_{0,1,2}.ogg` | rubberduck，[Water / Splash / Slime SFX](https://opengameart.org/content/40-cc0-water-splash-slime-sfx)，`water-sfx/slime_01/02/03.ogg` | CC0 1.0 | 复用；苔团黏湿跳动／受击 |
| `beetle` | `sfx/beetle_{0,1,2}.ogg` | qubodup，[Insect or alien scream](https://opengameart.org/content/insect-or-alien-scream)，`assets-src/vendor/oga/g2/raw/insect.flac`；Kenney，[Interface Sounds](https://kenney.nl/assets/interface-sounds)，`scratch_001/002/003.ogg` | CC0 1.0 | 新下载＋复用；甲壳刮擦、短促虫声 |
| `cast` | `sfx/cast_{0,1,2}.ogg` | pyranostudios，[Air whoosh](https://opengameart.org/content/air-whoosh)，`assets-src/vendor/oga/g2/raw/whoosh.wav` | CC0 1.0 | 新下载后剪辑；较挥剑舒展的甩竿风声 |
| `bite` | `sfx/bite_{0,1,2}.ogg` | rubberduck，[Water / Splash / Slime SFX](https://opengameart.org/content/40-cc0-water-splash-slime-sfx)，`water-sfx/bubble_01/02/03.ogg` | CC0 1.0 | 复用；水面咕嘟提示鱼咬钩 |
| `reel` | `sfx/reel_{0,1,2}.ogg` | Kenney，[Interface Sounds](https://kenney.nl/assets/interface-sounds)，`tick_001/002/004.ogg` | CC0 1.0 | 复用，间隔 50 毫秒的三连咔哒；短时反复触发 |
| `catch` | `sfx/catch_{0,1,2}.ogg` | rubberduck，[Water / Splash / Slime SFX](https://opengameart.org/content/40-cc0-water-splash-slime-sfx)，`water-sfx/splash_03/07/11.ogg` | CC0 1.0 | 复用；收鱼出水 |
| `cluck` | `sfx/cluck_{0,1,2}.ogg` | Breviceps，[Chicken clucking](https://freesound.org/people/Breviceps/sounds/456803/)，`assets-src/vendor/oga/g2/raw/chicken-preview.ogg` | CC0 1.0 | 新下载；三段不同的母鸡轻咕咕 |
| `rock_break` | `sfx/rock_break_{0,1,2}.ogg` | Kenney，[Impact Sounds](https://kenney.nl/assets/impact-sounds)，`impactMining_000/001/002` ＋ `impactGlass_heavy_000/001/002` | CC0 1.0 | 复用混音；玻璃层低通至 2.6 kHz，制作矿石碎裂 |
| `ladder` | `sfx/ladder_{0,1,2}.ogg` | Kenney，[Impact Sounds](https://kenney.nl/assets/impact-sounds) 的 `footstep_wood_000/001/002` ＋ [RPG Audio](https://kenney.nl/assets/rpg-audio) 的 `creak1/2/3` | CC0 1.0 | 复用混音；爬梯木踏板、轻吱嘎 |
| `forage` | `sfx/forage_{0,1,2}.ogg` | Kenney，[RPG Audio](https://kenney.nl/assets/rpg-audio)，`cloth1/2/3.ogg` | CC0 1.0 | 复用；柔软的采集翻动声 |
| `fanfare` | `sfx/fanfare_{0,1,2}.ogg` | Kenney，[Music Jingles](https://kenney.nl/assets/music-jingles)，`jingles_SAX10/11/12.ogg` | CC0 1.0 | 复用；节庆／完成提示短乐 |
| `river` | `music/river.ogg` | Juhani Junkala／SubspaceAudio，[JRPG Pack 4 Calm](https://opengameart.org/content/jrpg-pack-4-calm)，`Calm3 - Peaceful Days.ogg` | CC0 1.0 | 复用未使用曲目；河岸舒缓背景，保留 64 秒原生循环 |
| `forest` | `music/forest.ogg` | RandomMind，[Medieval: Exploration](https://opengameart.org/content/medieval-exploration)，`Exploration.mp3` | CC0 1.0 | 复用未使用曲目；浅林探索，制作 225 秒循环 |
| `mine` | `music/mine.ogg` | mutantleg，[Cave explorer](https://opengameart.org/content/cave-explorer)，`assets-src/vendor/oga/g2/raw/caveexplorer_hq.mp3` | CC0 1.0 | 新下载；矿洞探索，制作 70.5 秒循环 |
| `festival` | `music/festival.ogg` | neonarkade，[Quaint Town](https://opengameart.org/content/quaint-town)，`Quaint Town - LOOPABLE.mp3` | CC0 1.0 | 复用未使用曲目；轻快花种会，约 102.81 秒 |
| `amb_river` | `music/amb_river.ogg` | rubberduck，[Water / Splash / Slime SFX](https://opengameart.org/content/40-cc0-water-splash-slime-sfx)，`water-sfx/loop_water_01.ogg` | CC0 1.0 | 复用；约 3.23 秒流水循环，与 `river` 分总线播放 |
| `amb_cave` | `music/amb_cave.ogg` | JaggedStone，[Loopable Dungeon Ambience](https://opengameart.org/content/loopable-dungeon-ambience)，`assets-src/vendor/oga/g2/raw/dungeon_ambient.ogg` | CC0 1.0 | 新下载；约 94.16 秒洞穴风声与滴水循环 |


<!-- job8-dish-icons -->

## 公共厨房料理（任务 8）

| 资源 | 来源 | 许可 | 用途 |
| --- | --- | --- | --- |
| 自制清汤、烤萝卜：2 个 PNG、2 个 GLB | 本项目 Blender 程序化原创；`assets-src/blender/crops/generate_dishes.py`；复用任务 5 的原创网格、萝卜产物、顶点色、相机、柔光与描边 | 项目自制，无新增第三方素材 | `soup_clear`、`roast_radish` 图标与米制料理模型 |
| 对比图中的救济清汤 | 原有 `public/assets/icons/soup_relief.png`；Kenney Food Kit `bowl-soup`；既有 `assets-src/vendor/kenney/food-kit/License.txt` | CC0 1.0 | 仅用于 `_dishes.png` 对照，原图保持原样 |

本任务未下载素材；预览文字使用本机字体栅格化，不分发字体文件。


<!-- job10-dish-icons -->

## 公共厨房料理（任务 10）

| 资源 | 来源 | 许可 | 用途 |
| --- | --- | --- | --- |
| 野菜沙拉、蘑菇汤、烤鱼、煎蛋：4 个 PNG、4 个 GLB | 本项目 Blender 程序化原创；`assets-src/blender/crops/generate_dishes.py --job 10`；复用项目木器、叶片、鱼形网格、顶点色、正交相机、柔光与 2px 描边 | 项目自制，无新增第三方素材 | `salad_wild`、`soup_mushroom`、`fish_roast`、`egg_fried` |
| 七道菜对比图中的三道既有料理 | 既有 `soup_clear`、`roast_radish` 为项目原创；`soup_relief` 来自 Kenney Food Kit `bowl-soup`，包内 `License.txt` 已核对 | 项目自制／Kenney CC0 1.0 | 仅合成 `_dishes.png`，不修改原 PNG 或 GLB |

本任务未下载素材；预览文字仅使用本机字体栅格化，不分发字体文件。


<!-- job11-flora -->

## 地表草丛与野花（任务 11）

| 资源 | 来源 | 许可 | 用途 |
| --- | --- | --- | --- |
| 六种草丛 `grass_tuft_a` 至 `grass_tuft_f`、三叶草 `clover_patch` | 本项目 Blender 程序化原创；`assets-src/blender/flora/shapes.py` | 项目自制，无新增第三方素材 | 可实例化地表植被，全部叶片与细茎使用 `grass` 材质 |
| 雏菊、蒲公英、虞美人、蓝铃花、堇菜、薰衣草、混合花丛：`flower_daisy`、`flower_dandelion`、`flower_poppy`、`flower_bluebell`、`flower_violet`、`flower_lavender`、`flower_mixed` | 本项目 Blender 程序化原创；`assets-src/blender/flora/shapes.py` | 项目自制，无新增第三方素材 | 低多边形野花，按花色使用 `petal_*` 和 `flower_center`，无贴图、无顶点色 |
| 14 张单体预览、植被总览与 6×6 米草地效果图 | 正式 GLB 回读渲染；576 个共享网格实例；既有 G2/作物预览仅作为风格参考 | 项目自制 | 美术验收；不写入游戏代码 |

本任务未联网下载素材，未复制 Kenney 网格或贴图。复用项目既有 `characters/glb_io.py` 的 GLB 读取工具；预览文字使用本机微软雅黑栅格化，不分发字体文件。模型采用米制、Y 向上、正面 +Z、底面中心原点。


<!-- job13-herb-salve -->

## 草药膏（任务 13）

| 资源 | 来源 | 许可 | 用途 |
| --- | --- | --- | --- |
| `herb_salve.png`、`herb_salve.glb` 及独立预览 | 本项目 Blender 程序化原创；`assets-src/blender/crops/generate_salve.py`；复用料理木器、材质、正交相机、柔光、2px 描边，以及既有草药的尖叶网格和配色 | 项目自制，无新增第三方素材 | 草药膏图标、米制物品模型与验收 |
| 对照图中的 `herb`、`soup_clear` | 项目既有原创资源，仅合成预览 | 项目自制 | 草药叶形、材质与描边对照，原资源保持不变 |

本任务未下载素材；预览文字使用本机字体栅格化，不分发字体文件。

<!-- G3/G4 分任务台账（由 assets-src/ledger/*.md 合并） -->


## G3 · 任务 14：四季植被、果树与季节采集物授权台账（任务 14，原文件 `assets-src/ledger/job14.md`）

本任务未联网下载素材。源文件只读，产物仅写入任务单授权路径。

Kenney Nature Kit 2.1：CC0；本地许可：`assets-src/vendor/kenney/nature-kit/License.txt`。
Holiday Kit 2.0 的覆雪树仅作视觉参考，未复制网格；本地许可：`assets-src/vendor/kenney/holiday-kit/License.txt`。
草丛与灌木来自项目已有原创资源；其余为本项目程序化原创，沿用项目自有素材使用约定，不新增第三方许可义务。
图标复用现有作物渲染与后处理代码；预览标题使用本机微软雅黑栅格化，不分发字体。

| id | 文件 | 来源 / 许可 | 用途与改动 |
|---|---|---|---|
| tree_oak_summer | `public/assets/models/g3/flora/tree_oak_summer.glb` | `public/assets/kenney/nature-kit/tree_oak.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_oak_autumn | `public/assets/models/g3/flora/tree_oak_autumn.glb` | `public/assets/kenney/nature-kit/tree_oak.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_oak_winter | `public/assets/models/g3/flora/tree_oak_winter.glb` | `public/assets/kenney/nature-kit/tree_oak.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_default_summer | `public/assets/models/g3/flora/tree_default_summer.glb` | `public/assets/kenney/nature-kit/tree_default.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_default_autumn | `public/assets/models/g3/flora/tree_default_autumn.glb` | `public/assets/kenney/nature-kit/tree_default.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_default_winter | `public/assets/models/g3/flora/tree_default_winter.glb` | `public/assets/kenney/nature-kit/tree_default.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_detailed_summer | `public/assets/models/g3/flora/tree_detailed_summer.glb` | `public/assets/kenney/nature-kit/tree_detailed.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_detailed_autumn | `public/assets/models/g3/flora/tree_detailed_autumn.glb` | `public/assets/kenney/nature-kit/tree_detailed.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_detailed_winter | `public/assets/models/g3/flora/tree_detailed_winter.glb` | `public/assets/kenney/nature-kit/tree_detailed.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_fat_summer | `public/assets/models/g3/flora/tree_fat_summer.glb` | `public/assets/kenney/nature-kit/tree_fat.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_fat_autumn | `public/assets/models/g3/flora/tree_fat_autumn.glb` | `public/assets/kenney/nature-kit/tree_fat.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_fat_winter | `public/assets/models/g3/flora/tree_fat_winter.glb` | `public/assets/kenney/nature-kit/tree_fat.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_plateau_summer | `public/assets/models/g3/flora/tree_plateau_summer.glb` | `public/assets/kenney/nature-kit/tree_plateau.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_plateau_autumn | `public/assets/models/g3/flora/tree_plateau_autumn.glb` | `public/assets/kenney/nature-kit/tree_plateau.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_plateau_winter | `public/assets/models/g3/flora/tree_plateau_winter.glb` | `public/assets/kenney/nature-kit/tree_plateau.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_tall_summer | `public/assets/models/g3/flora/tree_tall_summer.glb` | `public/assets/kenney/nature-kit/tree_tall.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_tall_autumn | `public/assets/models/g3/flora/tree_tall_autumn.glb` | `public/assets/kenney/nature-kit/tree_tall.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_tall_winter | `public/assets/models/g3/flora/tree_tall_winter.glb` | `public/assets/kenney/nature-kit/tree_tall.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_pineRoundA_winter | `public/assets/models/g3/flora/tree_pineRoundA_winter.glb` | `public/assets/kenney/nature-kit/tree_pineRoundA.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_pineRoundC_winter | `public/assets/models/g3/flora/tree_pineRoundC_winter.glb` | `public/assets/kenney/nature-kit/tree_pineRoundC.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_pineRoundE_winter | `public/assets/models/g3/flora/tree_pineRoundE_winter.glb` | `public/assets/kenney/nature-kit/tree_pineRoundE.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_pineTallA_winter | `public/assets/models/g3/flora/tree_pineTallA_winter.glb` | `public/assets/kenney/nature-kit/tree_pineTallA.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_pineTallC_winter | `public/assets/models/g3/flora/tree_pineTallC_winter.glb` | `public/assets/kenney/nature-kit/tree_pineTallC.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_pineDefaultA_winter | `public/assets/models/g3/flora/tree_pineDefaultA_winter.glb` | `public/assets/kenney/nature-kit/tree_pineDefaultA.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| tree_pineDefaultB_winter | `public/assets/models/g3/flora/tree_pineDefaultB_winter.glb` | `public/assets/kenney/nature-kit/tree_pineDefaultB.glb` / Kenney CC0 | 保持尺寸与原点；夏秋重新配色，秋加落叶；冬季重建分叉枝或松冠承雪层 |
| grass_tuft_a_autumn | `public/assets/models/g3/flora/grass_tuft_a_autumn.glb` | `public/assets/models/flora/grass_tuft_a.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_a_winter | `public/assets/models/g3/flora/grass_tuft_a_winter.glb` | `public/assets/models/flora/grass_tuft_a.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_b_autumn | `public/assets/models/g3/flora/grass_tuft_b_autumn.glb` | `public/assets/models/flora/grass_tuft_b.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_b_winter | `public/assets/models/g3/flora/grass_tuft_b_winter.glb` | `public/assets/models/flora/grass_tuft_b.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_c_autumn | `public/assets/models/g3/flora/grass_tuft_c_autumn.glb` | `public/assets/models/flora/grass_tuft_c.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_c_winter | `public/assets/models/g3/flora/grass_tuft_c_winter.glb` | `public/assets/models/flora/grass_tuft_c.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_d_autumn | `public/assets/models/g3/flora/grass_tuft_d_autumn.glb` | `public/assets/models/flora/grass_tuft_d.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_d_winter | `public/assets/models/g3/flora/grass_tuft_d_winter.glb` | `public/assets/models/flora/grass_tuft_d.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_e_autumn | `public/assets/models/g3/flora/grass_tuft_e_autumn.glb` | `public/assets/models/flora/grass_tuft_e.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_e_winter | `public/assets/models/g3/flora/grass_tuft_e_winter.glb` | `public/assets/models/flora/grass_tuft_e.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_f_autumn | `public/assets/models/g3/flora/grass_tuft_f_autumn.glb` | `public/assets/models/flora/grass_tuft_f.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| grass_tuft_f_winter | `public/assets/models/g3/flora/grass_tuft_f_winter.glb` | `public/assets/models/flora/grass_tuft_f.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| clover_patch_autumn | `public/assets/models/g3/flora/clover_patch_autumn.glb` | `public/assets/models/flora/clover_patch.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| clover_patch_winter | `public/assets/models/g3/flora/clover_patch_winter.glb` | `public/assets/models/flora/clover_patch.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| flower_summer_a | `public/assets/models/g3/flora/flower_summer_a.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_summer_b | `public/assets/models/g3/flora/flower_summer_b.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_summer_c | `public/assets/models/g3/flora/flower_summer_c.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_summer_d | `public/assets/models/g3/flora/flower_summer_d.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_autumn_a | `public/assets/models/g3/flora/flower_autumn_a.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_autumn_b | `public/assets/models/g3/flora/flower_autumn_b.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_autumn_c | `public/assets/models/g3/flora/flower_autumn_c.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_autumn_d | `public/assets/models/g3/flora/flower_autumn_d.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_winter_a | `public/assets/models/g3/flora/flower_winter_a.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| flower_winter_b | `public/assets/models/g3/flora/flower_winter_b.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| snow_pile_a | `public/assets/models/g3/flora/snow_pile_a.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| snow_pile_b | `public/assets/models/g3/flora/snow_pile_b.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| leaf_pile_a | `public/assets/models/g3/flora/leaf_pile_a.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| leaf_pile_b | `public/assets/models/g3/flora/leaf_pile_b.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| snowman | `public/assets/models/g3/flora/snowman.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| bush_summer | `public/assets/models/g3/flora/bush_summer.glb` | `public/assets/models/g2/bush_berry.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| bush_autumn | `public/assets/models/g3/flora/bush_autumn.glb` | `public/assets/models/g2/bush_berry.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| bush_winter | `public/assets/models/g3/flora/bush_winter.glb` | `public/assets/models/g2/bush_berry.glb` / 项目原创 | 保留源几何尺度，季节顶点色与局部薄雪 |
| fruit_sapling | `public/assets/models/g3/flora/fruit_sapling.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| cherry_young | `public/assets/models/g3/flora/cherry_young.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| cherry_tree | `public/assets/models/g3/flora/cherry_tree.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 独立造型；果树拆分树冠、花和三枚果实节点 |
| apricot_young | `public/assets/models/g3/flora/apricot_young.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| apricot_tree | `public/assets/models/g3/flora/apricot_tree.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 独立造型；果树拆分树冠、花和三枚果实节点 |
| peach_young | `public/assets/models/g3/flora/peach_young.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| peach_tree | `public/assets/models/g3/flora/peach_tree.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 独立造型；果树拆分树冠、花和三枚果实节点 |
| lemon_young | `public/assets/models/g3/flora/lemon_young.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| lemon_tree | `public/assets/models/g3/flora/lemon_tree.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 独立造型；果树拆分树冠、花和三枚果实节点 |
| apple_young | `public/assets/models/g3/flora/apple_young.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| apple_tree | `public/assets/models/g3/flora/apple_tree.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 独立造型；果树拆分树冠、花和三枚果实节点 |
| persimmon_young | `public/assets/models/g3/flora/persimmon_young.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| persimmon_tree | `public/assets/models/g3/flora/persimmon_tree.glb` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 独立造型；果树拆分树冠、花和三枚果实节点 |
| cherry | `public/assets/models/items/cherry.glb`；`public/assets/icons/cherry.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| apricot | `public/assets/models/items/apricot.glb`；`public/assets/icons/apricot.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| peach | `public/assets/models/items/peach.glb`；`public/assets/icons/peach.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| lemon | `public/assets/models/items/lemon.glb`；`public/assets/icons/lemon.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| apple | `public/assets/models/items/apple.glb`；`public/assets/icons/apple.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| persimmon | `public/assets/models/items/persimmon.glb`；`public/assets/icons/persimmon.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| wild_pear | `public/assets/models/items/wild_pear.glb`；`public/assets/icons/wild_pear.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| winter_root | `public/assets/models/items/winter_root.glb`；`public/assets/icons/winter_root.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| chestnut | `public/assets/models/items/chestnut.glb`；`public/assets/icons/chestnut.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| snow_mushroom | `public/assets/models/items/snow_mushroom.glb`；`public/assets/icons/snow_mushroom.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| sapling_cherry | `public/assets/icons/sapling_cherry.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| sapling_apricot | `public/assets/icons/sapling_apricot.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| sapling_peach | `public/assets/icons/sapling_peach.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| sapling_lemon | `public/assets/icons/sapling_lemon.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| sapling_apple | `public/assets/icons/sapling_apple.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |
| sapling_persimmon | `public/assets/icons/sapling_persimmon.png` | `assets-src/blender/g3/job14/shapes.py` / 项目原创 | 原创低多边形造型与顶点色 |

预览：`assets-src/previews/g3/job14/`，均由正式 GLB 回读渲染；六张仅需图标的树苗直接渲染原创树苗几何。
动画：本任务无生物或动画资源，所有条目 `animations: []`。


## G3 · 任务 15 资源来源与授权台账（任务 15，原文件 `assets-src/ledger/job15.md`）

全部为项目程序化原创；复用项目既有网格、导出、摄影棚和图标处理代码，无新增第三方模型、纹理、动作或联网下载。
许可归属：项目自制，沿用项目代码和美术的授权安排；不擅自声明第三方 CC0。
字体仅使用本机微软雅黑生成预览标注，不分发字体文件。

| id | 文件 | 来源 / 许可证 | 用途与制作说明 |
| --- | --- | --- | --- |
| iron_wall_a | `public/assets/models/g3/mine/iron_wall_a.glb` | 本项目 `models.py`；项目自制 | 铁矿洞壁·层岩；复用 G2 洞壁拼接拓扑，重做岩层配色及主题配件 |
| iron_wall_b | `public/assets/models/g3/mine/iron_wall_b.glb` | 本项目 `models.py`；项目自制 | 铁矿洞壁·斜层；复用 G2 洞壁拼接拓扑，重做岩层配色及主题配件 |
| iron_wall_c | `public/assets/models/g3/mine/iron_wall_c.glb` | 本项目 `models.py`；项目自制 | 铁矿洞壁·断层；复用 G2 洞壁拼接拓扑，重做岩层配色及主题配件 |
| iron_wall_rust | `public/assets/models/g3/mine/iron_wall_rust.glb` | 本项目 `models.py`；项目自制 | 铁矿洞壁·旧管板；复用 G2 洞壁拼接拓扑，重做岩层配色及主题配件 |
| rock_node_iron_a | `public/assets/models/g3/mine/rock_node_iron_a.glb` | 本项目 `models.py`；项目自制 | 铁矿岩块 A；原创分件造型、平直顶点色；统一管线导出/渲染 |
| rock_node_iron_b | `public/assets/models/g3/mine/rock_node_iron_b.glb` | 本项目 `models.py`；项目自制 | 铁矿岩块 B；原创分件造型、平直顶点色；统一管线导出/渲染 |
| ore_iron | `public/assets/models/g3/mine/ore_iron.glb` | 本项目 `models.py`；项目自制 | 银灰铁矿点；原创分件造型、平直顶点色；统一管线导出/渲染 |
| ore_coal_iron | `public/assets/models/g3/mine/ore_coal_iron.glb` | 本项目 `models.py`；项目自制 | 旧铁矿煤点；原创分件造型、平直顶点色；统一管线导出/渲染 |
| rail_straight | `public/assets/models/g3/mine/rail_straight.glb` | 本项目 `models.py`；项目自制 | 旧铁轨·直段；原创分件造型、平直顶点色；统一管线导出/渲染 |
| rail_turn | `public/assets/models/g3/mine/rail_turn.glb` | 本项目 `models.py`；项目自制 | 旧铁轨·弯段；原创分件造型、平直顶点色；统一管线导出/渲染 |
| mine_cart_rusty | `public/assets/models/g3/mine/mine_cart_rusty.glb` | 本项目 `models.py`；项目自制 | 锈蚀矿车；原创分件造型、平直顶点色；统一管线导出/渲染 |
| iron_support | `public/assets/models/g3/mine/iron_support.glb` | 本项目 `models.py`；项目自制 | 钢箍木支撑；原创分件造型、平直顶点色；统一管线导出/渲染 |
| iron_lamp | `public/assets/models/g3/mine/iron_lamp.glb` | 本项目 `models.py`；项目自制 | 铁笼矿灯；原创分件造型、平直顶点色；统一管线导出/渲染 |
| slag_heap | `public/assets/models/g3/mine/slag_heap.glb` | 本项目 `models.py`；项目自制 | 矿渣堆；原创分件造型、平直顶点色；统一管线导出/渲染 |
| frost_wall_a | `public/assets/models/g3/mine/frost_wall_a.glb` | 本项目 `models.py`；项目自制 | 冰岩洞壁·层岩；复用 G2 洞壁拼接拓扑，重做岩层配色及主题配件 |
| frost_wall_b | `public/assets/models/g3/mine/frost_wall_b.glb` | 本项目 `models.py`；项目自制 | 冰岩洞壁·斜层；复用 G2 洞壁拼接拓扑，重做岩层配色及主题配件 |
| frost_wall_c | `public/assets/models/g3/mine/frost_wall_c.glb` | 本项目 `models.py`；项目自制 | 冰岩洞壁·断层；复用 G2 洞壁拼接拓扑，重做岩层配色及主题配件 |
| frost_wall_crystal | `public/assets/models/g3/mine/frost_wall_crystal.glb` | 本项目 `models.py`；项目自制 | 冰岩洞壁·晶簇；复用 G2 洞壁拼接拓扑，重做岩层配色及主题配件 |
| rock_node_frost_a | `public/assets/models/g3/mine/rock_node_frost_a.glb` | 本项目 `models.py`；项目自制 | 冰岩块 A；原创分件造型、平直顶点色；统一管线导出/渲染 |
| rock_node_frost_b | `public/assets/models/g3/mine/rock_node_frost_b.glb` | 本项目 `models.py`；项目自制 | 冰岩块 B；原创分件造型、平直顶点色；统一管线导出/渲染 |
| ore_crystal | `public/assets/models/g3/mine/ore_crystal.glb` | 本项目 `models.py`；项目自制 | 青晶矿点；原创分件造型、平直顶点色；统一管线导出/渲染 |
| ore_iron_frost | `public/assets/models/g3/mine/ore_iron_frost.glb` | 本项目 `models.py`；项目自制 | 寒晶矿铁矿点；原创分件造型、平直顶点色；统一管线导出/渲染 |
| crystal_cluster_a | `public/assets/models/g3/mine/crystal_cluster_a.glb` | 本项目 `models.py`；项目自制 | 青色晶簇；原创分件造型、平直顶点色；统一管线导出/渲染 |
| crystal_cluster_b | `public/assets/models/g3/mine/crystal_cluster_b.glb` | 本项目 `models.py`；项目自制 | 淡紫晶簇；原创分件造型、平直顶点色；统一管线导出/渲染 |
| ice_pillar | `public/assets/models/g3/mine/ice_pillar.glb` | 本项目 `models.py`；项目自制 | 完整晶柱掩体；原创分件造型、平直顶点色；统一管线导出/渲染 |
| ice_pillar_broken | `public/assets/models/g3/mine/ice_pillar_broken.glb` | 本项目 `models.py`；项目自制 | 晶柱残桩；原创分件造型、平直顶点色；统一管线导出/渲染 |
| frost_lamp | `public/assets/models/g3/mine/frost_lamp.glb` | 本项目 `models.py`；项目自制 | 冰晶灯；原创分件造型、平直顶点色；统一管线导出/渲染 |
| icicle_cluster | `public/assets/models/g3/mine/icicle_cluster.glb` | 本项目 `models.py`；项目自制 | 垂挂冰柱；原创分件造型、平直顶点色；统一管线导出/渲染 |
| supply_crate | `public/assets/models/g3/mine/supply_crate.glb` | 本项目 `models.py`；项目自制 | 据点补给箱；原创分件造型、平直顶点色；统一管线导出/渲染 |
| rest_bench | `public/assets/models/g3/mine/rest_bench.glb` | 本项目 `models.py`；项目自制 | 据点长凳；原创分件造型、平直顶点色；统一管线导出/渲染 |
| rescue_cabinet | `public/assets/models/g3/mine/rescue_cabinet.glb` | 本项目 `models.py`；项目自制 | 救援柜；原创分件造型、平直顶点色；统一管线导出/渲染 |
| safety_sign | `public/assets/models/g3/mine/safety_sign.glb` | 本项目 `models.py`；项目自制 | 空白安全告示牌；原创分件造型、平直顶点色；统一管线导出/渲染 |
| rope_post | `public/assets/models/g3/mine/rope_post.glb` | 本项目 `models.py`；项目自制 | 两米安全绳桩；原创分件造型、平直顶点色；统一管线导出/渲染 |
| boss_gate | `public/assets/models/g3/mine/boss_gate.glb` | 本项目 `models.py`；项目自制 | 首领房升降石门；原创分件造型、平直顶点色；统一管线导出/渲染 |
| iron_ore | `public/assets/models/items/iron_ore.glb`；`public/assets/icons/iron_ore.png` | 本项目 `models.py`；项目自制 | 铁矿石；原创分件造型、平直顶点色；统一管线导出/渲染 |
| crystal_ore | `public/assets/models/items/crystal_ore.glb`；`public/assets/icons/crystal_ore.png` | 本项目 `models.py`；项目自制 | 青晶原矿；原创分件造型、平直顶点色；统一管线导出/渲染 |
| iron_bar | `public/assets/models/items/iron_bar.glb`；`public/assets/icons/iron_bar.png` | 本项目 `models.py`；项目自制 | 铁锭；原创分件造型、平直顶点色；统一管线导出/渲染 |
| alloy_bar | `public/assets/models/items/alloy_bar.glb`；`public/assets/icons/alloy_bar.png` | 本项目 `models.py`；项目自制 | 蓝紫合金锭；原创分件造型、平直顶点色；统一管线导出/渲染 |
| hardwood | `public/assets/models/items/hardwood.glb`；`public/assets/icons/hardwood.png` | 本项目 `models.py`；项目自制 | 硬木；原创分件造型、平直顶点色；统一管线导出/渲染 |
| hide_scrap | `public/assets/models/items/hide_scrap.glb`；`public/assets/icons/hide_scrap.png` | 本项目 `models.py`；项目自制 | 兽皮杂料；原创分件造型、平直顶点色；统一管线导出/渲染 |
| core_boss | `public/assets/models/items/core_boss.glb`；`public/assets/icons/core_boss.png` | 本项目 `models.py`；项目自制 | 风车核心件；原创分件造型、平直顶点色；统一管线导出/渲染 |
| core_trade | `public/assets/models/items/core_trade.glb`；`public/assets/icons/core_trade.png` | 本项目 `models.py`；项目自制 | 替代核心件；原创分件造型、平直顶点色；统一管线导出/渲染 |
| sword_copper | `public/assets/models/items/sword_copper.glb`；`public/assets/icons/sword_copper.png` | 本项目 `models.py`；项目自制 | 铜制短剑；原创分件造型、平直顶点色；统一管线导出/渲染 |
| sword_iron | `public/assets/models/items/sword_iron.glb`；`public/assets/icons/sword_iron.png` | 本项目 `models.py`；项目自制 | 铁制短剑；原创分件造型、平直顶点色；统一管线导出/渲染 |
| sword_alloy | `public/assets/models/items/sword_alloy.glb`；`public/assets/icons/sword_alloy.png` | 本项目 `models.py`；项目自制 | 合金短剑；原创分件造型、平直顶点色；统一管线导出/渲染 |
| spear_copper | `public/assets/models/items/spear_copper.glb`；`public/assets/icons/spear_copper.png` | 本项目 `models.py`；项目自制 | 铜制长柄；原创分件造型、平直顶点色；统一管线导出/渲染 |
| spear_iron | `public/assets/models/items/spear_iron.glb`；`public/assets/icons/spear_iron.png` | 本项目 `models.py`；项目自制 | 铁制长柄；原创分件造型、平直顶点色；统一管线导出/渲染 |
| spear_alloy | `public/assets/models/items/spear_alloy.glb`；`public/assets/icons/spear_alloy.png` | 本项目 `models.py`；项目自制 | 合金长柄；原创分件造型、平直顶点色；统一管线导出/渲染 |
| bow_copper | `public/assets/models/items/bow_copper.glb`；`public/assets/icons/bow_copper.png` | 本项目 `models.py`；项目自制 | 铜制轻弓；原创分件造型、平直顶点色；统一管线导出/渲染 |
| bow_iron | `public/assets/models/items/bow_iron.glb`；`public/assets/icons/bow_iron.png` | 本项目 `models.py`；项目自制 | 铁制轻弓；原创分件造型、平直顶点色；统一管线导出/渲染 |
| bow_alloy | `public/assets/models/items/bow_alloy.glb`；`public/assets/icons/bow_alloy.png` | 本项目 `models.py`；项目自制 | 合金轻弓；原创分件造型、平直顶点色；统一管线导出/渲染 |
| arrow_practice | `public/assets/models/items/arrow_practice.glb`；`public/assets/icons/arrow_practice.png` | 本项目 `models.py`；项目自制 | 练习箭；原创分件造型、平直顶点色；统一管线导出/渲染 |
| armor_copper | `public/assets/icons/armor_copper.png` | 本项目 `models.py`；项目自制 | 铜制胸甲；原创分件造型、平直顶点色；统一管线导出/渲染 |
| armor_iron | `public/assets/icons/armor_iron.png` | 本项目 `models.py`；项目自制 | 铁制胸甲；原创分件造型、平直顶点色；统一管线导出/渲染 |
| armor_alloy | `public/assets/icons/armor_alloy.png` | 本项目 `models.py`；项目自制 | 合金胸甲；原创分件造型、平直顶点色；统一管线导出/渲染 |

### 复用代码（只读）

- `assets-src/blender/g2/shapes.py`：Model、岩石、钢木支撑、灯笼和洞壁边界。
- `assets-src/blender/crops/geometry.py`：顶点色低多边形网格工具。
- `assets-src/blender/g2/generate.py`：网格转换与材质；`characters/glb_io.py`：GLB 读取。
- `assets-src/blender/crops/generate.py`：同一相机、灯光、色彩管理；`crops/build.py::process_icon`：同一尺寸与描边。


## G3 · 任务 16 授权与来源台账（任务 16，原文件 `assets-src/ledger/job16.md`）

所有模型、分件、配色和动作均为本任务程序化原创，属于项目自制资产；没有新增第三方美术素材、动作或贴图，没有联网下载。

| 文件 | 来源 | 许可证 / 权利说明 | 用途与加工 |
|---|---|---|---|
| `public/assets/models/g3/creatures/enemy_crab.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 碎石蟹，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_bat.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 穴翼兽，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_ironbug.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 铁壳虫，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_claw.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 矿爪兽，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_moth.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 萤粉蛾，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_rockback.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 岩背兽，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_spiker.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 晶刺虫，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_wisp.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 霜灵，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_crystalwing.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 晶翼兽，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/enemy_guard.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 旧矿岩卫，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/boss_gatekeeper.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 石背守门者，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/boss_furnace.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 炉心甲兽，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/boss_crystal.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 结晶岩心，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/proj_crystal.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 晶刺弹，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/proj_spore.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 毒粉团，原创分件、平直顶点色、刚体动画 |
| `public/assets/models/g3/creatures/proj_boulder.glb` | `creatures16.py` 与 `motions16.py` | 项目自制；未新增第三方许可 | 落石，原创分件、平直顶点色、刚体动画 |

复用项目既有 `assets-src/blender/g2/shapes.py` 的网格工具、`g2/generate.py` 的材质/GLB/摄影管线、`crops/geometry.py` 的原创网格函数和 `characters/glb_io.py` 的二进制读写；未修改这些文件。预览文字使用本机微软雅黑栅格化，不分发字体。Kenney 目录未复制任何网格。


## G3 · 任务 17 资源来源与授权台账（任务 17，原文件 `assets-src/ledger/job17.md`）

本任务全部造型为项目内程序化原创，未下载或引入第三方模型。资产按项目现有许可管理；不为项目自制内容另行声称 CC0 授权。

| ID | 文件 | 来源 | 许可 | 用途与制作说明 |
| --- | --- | --- | --- | --- |
| mill | `public/assets/icons/mill.png`；`public/assets/models/items/mill.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 磨粉机；分件、平直顶点色与原创细节 |
| pickle_jar | `public/assets/icons/pickle_jar.png`；`public/assets/models/items/pickle_jar.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 腌渍缸；分件、平直顶点色与原创细节 |
| jam_pot | `public/assets/icons/jam_pot.png`；`public/assets/models/items/jam_pot.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 果酱锅；分件、平直顶点色与原创细节 |
| cheese_press | `public/assets/icons/cheese_press.png`；`public/assets/models/items/cheese_press.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 乳酪压机；分件、平直顶点色与原创细节 |
| loom | `public/assets/icons/loom.png`；`public/assets/models/items/loom.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 织机；分件、平直顶点色与原创细节 |
| oil_press | `public/assets/icons/oil_press.png`；`public/assets/models/items/oil_press.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 榨油机；分件、平直顶点色与原创细节 |
| beehive | `public/assets/icons/beehive.png`；`public/assets/models/items/beehive.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 蜂箱；分件、平直顶点色与原创细节 |
| bake_oven | `public/assets/icons/bake_oven.png`；`public/assets/models/items/bake_oven.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 烘焙炉；分件、平直顶点色与原创细节 |
| seed_maker | `public/assets/icons/seed_maker.png`；`public/assets/models/items/seed_maker.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 种子分离器；分件、平直顶点色与原创细节 |
| auto_hopper | `public/assets/icons/auto_hopper.png`；`public/assets/models/items/auto_hopper.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 自动进料柜；分件、平直顶点色与原创细节 |
| auto_collector | `public/assets/icons/auto_collector.png`；`public/assets/models/items/auto_collector.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 自动收集柜；分件、平直顶点色与原创细节 |
| chest_big | `public/assets/icons/chest_big.png`；`public/assets/models/items/chest_big.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 大木箱；分件、平直顶点色与原创细节 |
| fence_wood | `public/assets/icons/fence_wood.png`；`public/assets/models/items/fence_wood.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 木栅栏；分件、平直顶点色与原创细节 |
| gate_wood | `public/assets/icons/gate_wood.png`；`public/assets/models/items/gate_wood.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 木门；分件、平直顶点色与原创细节 |
| path_wood_a | `public/assets/icons/path_wood_a.png`；`public/assets/models/items/path_wood_a.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 木路 A；分件、平直顶点色与原创细节 |
| path_wood_b | `public/assets/icons/path_wood_b.png`；`public/assets/models/items/path_wood_b.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 木路 B；分件、平直顶点色与原创细节 |
| path_stone_a | `public/assets/icons/path_stone_a.png`；`public/assets/models/items/path_stone_a.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 石路 A；分件、平直顶点色与原创细节 |
| path_stone_b | `public/assets/icons/path_stone_b.png`；`public/assets/models/items/path_stone_b.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 石路 B；分件、平直顶点色与原创细节 |
| sprinkler | `public/assets/icons/sprinkler.png`；`public/assets/models/items/sprinkler.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 基础喷灌；分件、平直顶点色与原创细节 |
| sprinkler_plus | `public/assets/icons/sprinkler_plus.png`；`public/assets/models/items/sprinkler_plus.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 改良喷灌；分件、平直顶点色与原创细节 |
| pipe | `public/assets/icons/pipe.png`；`public/assets/models/items/pipe.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 水管；分件、平直顶点色与原创细节 |
| water_tank | `public/assets/icons/water_tank.png`；`public/assets/models/items/water_tank.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 蓄水箱；分件、平直顶点色与原创细节 |
| campfire | `public/assets/icons/campfire.png`；`public/assets/models/items/campfire.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 营火；分件、平直顶点色与原创细节 |
| torch | `public/assets/icons/torch.png`；`public/assets/models/items/torch.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 火把；分件、平直顶点色与原创细节 |
| lamp_post | `public/assets/icons/lamp_post.png`；`public/assets/models/items/lamp_post.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 路灯；分件、平直顶点色与原创细节 |
| crab_pot | `public/assets/icons/crab_pot.png`；`public/assets/models/items/crab_pot.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 捕捞笼；分件、平直顶点色与原创细节 |
| flour | `public/assets/icons/flour.png`；`public/assets/models/items/flour.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 面粉；分件、平直顶点色与原创细节 |
| bread | `public/assets/icons/bread.png`；`public/assets/models/items/bread.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 面包；分件、平直顶点色与原创细节 |
| pickle | `public/assets/icons/pickle.png`；`public/assets/models/items/pickle.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 腌菜；分件、平直顶点色与原创细节 |
| jam | `public/assets/icons/jam.png`；`public/assets/models/items/jam.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 果酱；分件、平直顶点色与原创细节 |
| cheese_cow | `public/assets/icons/cheese_cow.png`；`public/assets/models/items/cheese_cow.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 牛乳酪；分件、平直顶点色与原创细节 |
| cheese_goat | `public/assets/icons/cheese_goat.png`；`public/assets/models/items/cheese_goat.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 羊乳酪；分件、平直顶点色与原创细节 |
| cloth | `public/assets/icons/cloth.png`；`public/assets/models/items/cloth.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 布；分件、平直顶点色与原创细节 |
| veg_oil | `public/assets/icons/veg_oil.png`；`public/assets/models/items/veg_oil.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 植物油；分件、平直顶点色与原创细节 |
| honey | `public/assets/icons/honey.png`；`public/assets/models/items/honey.glb` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 蜂蜜；分件、平直顶点色与原创细节 |
| fert_water | `public/assets/icons/fert_water.png` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 保水肥；分件、平直顶点色与原创细节 |
| bobber | `public/assets/icons/bobber.png` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 稳定浮漂；分件、平直顶点色与原创细节 |
| supply_pack | `public/assets/icons/supply_pack.png` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 便携补给包；分件、平直顶点色与原创细节 |
| winter_coat | `public/assets/icons/winter_coat.png` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 防寒衣；分件、平直顶点色与原创细节 |
| antidote | `public/assets/icons/antidote.png` | `assets-src/blender/g3/job17/models.py` 原创造型 | 项目自制，沿用项目许可 | 解毒药；分件、平直顶点色与原创细节 |

### 只读复用

- `assets-src/blender/crops/geometry.py`：项目已有 Mesh、顶点色与低多边形构造。
- `assets-src/blender/g2/shapes.py`：项目已有 Model、木梁、圆环、石块。
- `assets-src/blender/crops/generate.py`：原有材质、Cycles 16 samples、正交相机、三盏柔光与透明底。
- `assets-src/blender/crops/build.py`：原有 `process_icon`、100px 主体、128px 画布、2px 深色描边；只重定向预览目录并处理本任务 ID。
- `assets-src/blender/characters/glb_io.py`：原有 GLB 读写、动画 accessor 追加。
- `_icons.png` 中的熔炉、烘干架、品质肥、帆布包为项目原创；木箱仅复用已有 PNG 作比较，原始 Kenney Survival Kit 来源与 CC0 授权见项目已有 `assets-src/ASSET_LEDGER.md`。
- 预览用本机微软雅黑字体栅格化标注，不分发字体文件。
- `vendor/`、`src/`、共享 manifest、共享台账与共享工具均未由本脚本写入。


## G3 · 任务 18 授权台账（任务 18，原文件 `assets-src/ledger/job18.md`）

全部新增造型由本项目脚本原创，复用已有项目网格及渲染函数；无下载、无新增第三方模型、纹理或动作。
来源：`assets-src/blender/g3/job18/dishes.py`、`fish.py`；基础工具来自 `assets-src/blender/crops/geometry.py`、`geometry_g2.py`、`generate_dishes.py`。
许可证说明：项目自制，遵循项目自身授权；不擅自将项目代码或资产重新声明为 CC0。

| id | 文件 | 来源 / 许可 | 用途与改动说明 |
| --- | --- | --- | --- |
| `porridge_milk` | `public/assets/models/items/porridge_milk.glb`；`public/assets/icons/porridge_milk.png` | 项目原创 / 项目自身授权 | 牛奶粥静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `stew_tomato` | `public/assets/models/items/stew_tomato.glb`；`public/assets/icons/stew_tomato.png` | 项目原创 / 项目自身授权 | 番茄炖菜静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `soup_pumpkin` | `public/assets/models/items/soup_pumpkin.glb`；`public/assets/icons/soup_pumpkin.png` | 项目原创 / 项目自身授权 | 南瓜浓汤静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `gratin_sweet_potato` | `public/assets/models/items/gratin_sweet_potato.glb`；`public/assets/icons/gratin_sweet_potato.png` | 项目原创 / 项目自身授权 | 红薯焗饭静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `pie_berry` | `public/assets/models/items/pie_berry.glb`；`public/assets/icons/pie_berry.png` | 项目原创 / 项目自身授权 | 浆果派静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `rice_fried_veg` | `public/assets/models/items/rice_fried_veg.glb`；`public/assets/icons/rice_fried_veg.png` | 项目原创 / 项目自身授权 | 蔬菜炒饭静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `bento_fish` | `public/assets/models/items/bento_fish.glb`；`public/assets/icons/bento_fish.png` | 项目原创 / 项目自身授权 | 鱼肉便当静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `tea_herb` | `public/assets/models/items/tea_herb.glb`；`public/assets/icons/tea_herb.png` | 项目原创 / 项目自身授权 | 香草茶静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `drink_honey` | `public/assets/models/items/drink_honey.glb`；`public/assets/icons/drink_honey.png` | 项目原创 / 项目自身授权 | 蜂蜜饮静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `platter_cheese` | `public/assets/models/items/platter_cheese.glb`；`public/assets/icons/platter_cheese.png` | 项目原创 / 项目自身授权 | 乳酪拼盘静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `soup_fish_spicy` | `public/assets/models/items/soup_fish_spicy.glb`；`public/assets/icons/soup_fish_spicy.png` | 项目原创 / 项目自身授权 | 辣味鱼汤静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `ration_trail` | `public/assets/models/items/ration_trail.glb`；`public/assets/icons/ration_trail.png` | 项目原创 / 项目自身授权 | 山野干粮静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `feast_harvest` | `public/assets/models/items/feast_harvest.glb`；`public/assets/icons/feast_harvest.png` | 项目原创 / 项目自身授权 | 丰收宴静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_rainbarbel` | `public/assets/models/items/fish_rainbarbel.glb`；`public/assets/icons/fish_rainbarbel.png` | 项目原创 / 项目自身授权 | 雨须鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_lampfish` | `public/assets/models/items/fish_lampfish.glb`；`public/assets/icons/fish_lampfish.png` | 项目原创 / 项目自身授权 | 春灯鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_redtail` | `public/assets/models/items/fish_redtail.glb`；`public/assets/icons/fish_redtail.png` | 项目原创 / 项目自身授权 | 红尾鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_yellowperch` | `public/assets/models/items/fish_yellowperch.glb`；`public/assets/icons/fish_yellowperch.png` | 项目原创 / 项目自身授权 | 黄鳍鲈静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_bambooeel` | `public/assets/models/items/fish_bambooeel.glb`；`public/assets/icons/fish_bambooeel.png` | 项目原创 / 项目自身授权 | 竹纹鳗静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_mirrorscale` | `public/assets/models/items/fish_mirrorscale.glb`；`public/assets/icons/fish_mirrorscale.png` | 项目原创 / 项目自身授权 | 镜鳞鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_mudback` | `public/assets/models/items/fish_mudback.glb`；`public/assets/icons/fish_mudback.png` | 项目原创 / 项目自身授权 | 泥背鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_fireflytrout` | `public/assets/models/items/fish_fireflytrout.glb`；`public/assets/icons/fish_fireflytrout.png` | 项目原创 / 项目自身授权 | 流萤鳟静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_goldcarp` | `public/assets/models/items/fish_goldcarp.glb`；`public/assets/icons/fish_goldcarp.png` | 项目原创 / 项目自身授权 | 金纹鲤静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_brownfin` | `public/assets/models/items/fish_brownfin.glb`；`public/assets/icons/fish_brownfin.png` | 项目原创 / 项目自身授权 | 褐鳍鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_maplebass` | `public/assets/models/items/fish_maplebass.glb`；`public/assets/icons/fish_maplebass.png` | 项目原创 / 项目自身授权 | 枫影鲈静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_stonebarbel` | `public/assets/models/items/fish_stonebarbel.glb`；`public/assets/icons/fish_stonebarbel.png` | 项目原创 / 项目自身授权 | 石须鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_mooneel` | `public/assets/models/items/fish_mooneel.glb`；`public/assets/icons/fish_mooneel.png` | 项目原创 / 项目自身授权 | 银月鳗静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_crownfish` | `public/assets/models/items/fish_crownfish.glb`；`public/assets/icons/fish_crownfish.png` | 项目原创 / 项目自身授权 | 秋冠鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_icescale` | `public/assets/models/items/fish_icescale.glb`；`public/assets/icons/fish_icescale.png` | 项目原创 / 项目自身授权 | 冰鳞鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_snowcarp` | `public/assets/models/items/fish_snowcarp.glb`；`public/assets/icons/fish_snowcarp.png` | 项目原创 / 项目自身授权 | 雪纹鲫静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_coldtrout` | `public/assets/models/items/fish_coldtrout.glb`；`public/assets/icons/fish_coldtrout.png` | 项目原创 / 项目自身授权 | 冷泉鳟静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_deepeel` | `public/assets/models/items/fish_deepeel.glb`；`public/assets/icons/fish_deepeel.png` | 项目原创 / 项目自身授权 | 深蓝鳗静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_frostbarbel` | `public/assets/models/items/fish_frostbarbel.glb`；`public/assets/icons/fish_frostbarbel.png` | 项目原创 / 项目自身授权 | 霜须鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `fish_winterstar` | `public/assets/models/items/fish_winterstar.glb`；`public/assets/icons/fish_winterstar.png` | 项目原创 / 项目自身授权 | 冬星鱼静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `crayfish` | `public/assets/models/items/crayfish.glb`；`public/assets/icons/crayfish.png` | 项目原创 / 项目自身授权 | 小龙虾静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |
| `river_snail` | `public/assets/models/items/river_snail.glb`；`public/assets/icons/river_snail.png` | 项目原创 / 项目自身授权 | 河螺静态物品；原创几何、平直顶点色、底面中心；统一图标管线 |

### 仅用于对照的既有资源

混排图中的 `soup_clear`、`salad_wild`、`fish_roast`、`egg_fried`、`roast_radish`、`soup_mushroom`、`fish_silverscale`、`fish_grasscarp`、`fish_bluecarp`、`fish_spottrout` 均为项目既有原创资源；仅读取原 PNG 合成预览。
本机微软雅黑用于预览文字栅格化，不复制或分发字体文件。
渲染直接使用已导出的正式 GLB；所有缩略图、反面图、联系表均为本任务衍生预览。


## G3 · job19 动物、产物、工具与棚舍道具台账（任务 19，原文件 `assets-src/ledger/job19.md`）

全部新增几何与动作由本任务脚本原创；复用项目已有 G2 刚体层级/顶点色网格/GLB 动画写入，以及 crops 图标管线。无新下载素材，无外部贴图。

许可证：项目原创资产，按项目许可使用；本任务不额外授予第三方开源许可。比例图中的鸡只读取既有 G2 资产，不改写该文件。

| id | 文件 | 来源与用途 | 制作说明 |
|---|---|---|---|
| duck | `public/assets/models/g3/animals/duck.glb` | 本项目原创；鸭 | 原创关节层级、表情与 6 段动画 |
| rabbit | `public/assets/models/g3/animals/rabbit.glb` | 本项目原创；兔 | 原创关节层级、表情与 6 段动画 |
| cow | `public/assets/models/g3/animals/cow.glb` | 本项目原创；奶牛 | 原创关节层级、表情与 6 段动画 |
| sheep | `public/assets/models/g3/animals/sheep.glb` | 本项目原创；绵羊 | 原创关节层级、表情与 6 段动画；独立 wool 与完整瘦羊身体 |
| goat | `public/assets/models/g3/animals/goat.glb` | 本项目原创；山羊 | 原创关节层级、表情与 6 段动画 |
| duck_egg | `public/assets/models/items/duck_egg.glb`；`public/assets/icons/duck_egg.png` | 本项目原创；鸭蛋 | 原创分件造型；统一图标管线 |
| rabbit_fur | `public/assets/models/items/rabbit_fur.glb`；`public/assets/icons/rabbit_fur.png` | 本项目原创；兔绒 | 原创分件造型；统一图标管线 |
| milk | `public/assets/models/items/milk.glb`；`public/assets/icons/milk.png` | 本项目原创；牛奶 | 原创分件造型；统一图标管线 |
| goat_milk | `public/assets/models/items/goat_milk.glb`；`public/assets/icons/goat_milk.png` | 本项目原创；羊奶 | 原创分件造型；统一图标管线 |
| wool | `public/assets/models/items/wool.glb`；`public/assets/icons/wool.png` | 本项目原创；羊毛 | 原创分件造型；统一图标管线 |
| milk_pail | `public/assets/models/items/milk_pail.glb`；`public/assets/icons/milk_pail.png` | 本项目原创；挤奶桶 | 原创分件造型；统一图标管线 |
| shears | `public/assets/models/items/shears.glb`；`public/assets/icons/shears.png` | 本项目原创；剪毛剪 | 原创分件造型；统一图标管线 |
| hay_trough | `public/assets/models/g3/animals/hay_trough.glb` | 本项目原创；畜棚饲草槽 | 原创棚舍道具；独立 hay，可显示空槽 |
| water_trough | `public/assets/models/g3/animals/water_trough.glb` | 本项目原创；饮水槽 | 原创棚舍道具 |
| animal_bed | `public/assets/models/g3/animals/animal_bed.glb` | 本项目原创；草垫窝 | 原创棚舍道具 |
| product_basket | `public/assets/models/g3/animals/product_basket.glb` | 本项目原创；产物篮 | 原创棚舍道具 |

### 只读复用来源

- `assets-src/blender/g2/{generate,shapes,motions}.py`：网格对象、平直顶点色、刚体节点与 30fps 动画访问器。
- `assets-src/blender/characters/glb_io.py`：GLB 读写。
- `assets-src/blender/crops/{geometry,generate,build}.py`：基础网格、正交相机、Cycles 柔光与 128px/2px 描边。
- `public/assets/models/g2/chicken.glb`：比例图只读参照。
- `public/assets/icons/{egg,hay,tool_hoe_base}.png`：图标一致性只读参照。


## G3 · job20 建筑授权台账（任务 20，原文件 `assets-src/ledger/job20.md`）

全部使用本地素材与项目自制构件，未联网下载。源目录只读。

| 文件 | 来源与许可证 | 用途与改动 |
|---|---|---|
| `public/assets/models/g3/buildings/farmhouse_1.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-wood-door.glb、wall-wood-window-shutters.glb、wall-wood.glb | 家宅1级；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/farmhouse_2.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-wood-door.glb、wall-wood-window-shutters.glb、wall-wood.glb | 家宅2级；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/coop_big.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-wood-door.glb、wall-wood-window-shutters.glb、wall-wood.glb | 升级禽舍；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/barn_big.glb` | 项目自制构件；Kenney CC0 1.0：graveyard-kit：hay-bale.glb | 升级畜棚；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/silo.glb` | 项目自制构件，无第三方模型 | 筒仓；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/workshop.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-door.glb、wall-window-glass.glb、wall.glb | 私人作坊；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/cabin.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-wood-door.glb、wall-wood-window-shutters.glb、wall-wood.glb | 小屋；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/construction_site.glb` | 项目自制构件，无第三方模型 | 通用工地；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/bridge_ruined.glb` | 项目自制构件，无第三方模型 | 林桥·破败；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/bridge_scaffold.glb` | 项目自制构件，无第三方模型 | 林桥·施工；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/bridge.glb` | 项目自制构件，无第三方模型 | 林桥·完成；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/station_ruined.glb` | 项目自制构件，无第三方模型 | 驿站·破败；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/station_scaffold.glb` | 项目自制构件，无第三方模型 | 驿站·施工；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/station.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-door.glb、wall-window-glass.glb、wall.glb；survival-kit：box.glb | 驿站·完成；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/greenhouse_ruined.glb` | 项目自制构件，无第三方模型 | 温室·破败；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/greenhouse_scaffold.glb` | 项目自制构件，无第三方模型 | 温室·施工；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/greenhouse.glb` | 项目自制构件，无第三方模型 | 温室·完成；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/carpenter_shop.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-wood-door.glb、wall-wood-window-shutters.glb、wall-wood.glb | 木工坊；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/ranch_house.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-wood-door.glb、wall-wood-window-shutters.glb、wall-wood.glb；graveyard-kit：hay-bale.glb | 牧场；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/clinic.glb` | 项目自制构件；Kenney CC0 1.0：fantasy-town-kit：wall-door.glb、wall-window-glass.glb、wall.glb | 诊所；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |
| `public/assets/models/g3/buildings/trader_stall.glb` | 项目自制构件；Kenney CC0 1.0：food-kit：cabbage.glb、carrot.glb | 行商摊位；复用建筑色板与构件，重组轮廓、屋顶、功能配件及入口 |

### 第三方许可证原件

- `assets-src/vendor/kenney/fantasy-town-kit/License.txt`：Kenney，CC0 1.0；模型引用的 colormap.png 随GLB内嵌。
- `assets-src/vendor/kenney/food-kit/License.txt`：Kenney，CC0 1.0；模型引用的 colormap.png 随GLB内嵌。
- `assets-src/vendor/kenney/graveyard-kit/License.txt`：Kenney，CC0 1.0；模型引用的 colormap.png 随GLB内嵌。
- `assets-src/vendor/kenney/survival-kit/License.txt`：Kenney，CC0 1.0；模型引用的 colormap.png 随GLB内嵌。

### 项目复用

- `assets-src/blender/buildings/build.py`：只读调用墙体、门窗、瓦面、倒角、材质合并和预览函数；不调用其 main、ledger 或共享清单写入。
- `_scale.png` 使用原有 farmhouse、coop、barn、well、shop_general 作为同尺度参照；这些原文件没有修改。
- 本任务新增厨房、阁楼、料斗、通风塔、筒仓、工坊配件、桥梁三态、驿站三态和温室三态均由本目录脚本生成。


## G3 · 任务 21：区域景物授权台账（任务 21，原文件 `assets-src/ledger/job21.md`）

全部网格、配色和动作由本项目程序化原创；未下载或复制第三方模型、贴图、动作。
复用本项目 `assets-src/blender/crops/geometry.py`、`g2/shapes.py`、`g2/generate.py`、`characters/glb_io.py` 的网格与导出工具（只读）。
风格参照简报指定的既有建筑、作物、G2、植被、物品和图标预览。预览文字由本机微软雅黑栅格化，不分发字体文件。

| ID / 文件 | 来源 | 许可证 | 用途与制作说明 |
|---|---|---|---|
| `hardwood_tree_a` → `public/assets/models/g3/regions/hardwood_tree_a.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：盘根阔冠古树；平直顶点色 |
| `hardwood_tree_b` → `public/assets/models/g3/regions/hardwood_tree_b.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：双干高冠古树；平直顶点色 |
| `hardwood_stump` → `public/assets/models/g3/regions/hardwood_stump.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：硬木年轮树桩；平直顶点色 |
| `giant_mushroom` → `public/assets/models/g3/regions/giant_mushroom.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：赭红巨型蘑菇；平直顶点色 |
| `fern_a` → `public/assets/models/g3/regions/fern_a.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：舒展羽叶蕨；平直顶点色 |
| `fern_b` → `public/assets/models/g3/regions/fern_b.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：卷芽高蕨；平直顶点色 |
| `mossy_rock_a` → `public/assets/models/g3/regions/mossy_rock_a.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：覆苔卧巨石；平直顶点色 |
| `mossy_rock_b` → `public/assets/models/g3/regions/mossy_rock_b.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：裂隙立巨石；平直顶点色 |
| `forest_shrine` → `public/assets/models/g3/regions/forest_shrine.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 深林：无纹林中石龛；平直顶点色 |
| `cattail_a` → `public/assets/models/g3/regions/cattail_a.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：褐穗香蒲丛；平直顶点色 |
| `cattail_b` → `public/assets/models/g3/regions/cattail_b.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：疏生香蒲丛；平直顶点色 |
| `lily_pad_flower` → `public/assets/models/g3/regions/lily_pad_flower.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：粉花睡莲；平直顶点色 |
| `boardwalk_straight` → `public/assets/models/g3/regions/boardwalk_straight.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：桩基栈道直段；平直顶点色 |
| `boardwalk_turn` → `public/assets/models/g3/regions/boardwalk_turn.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：拼角栈道弯段；平直顶点色 |
| `wetland_deadtree` → `public/assets/models/g3/regions/wetland_deadtree.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：水边风化枯树；平直顶点色 |
| `mud_mound` → `public/assets/models/g3/regions/mud_mound.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：根纹泥丘；平直顶点色 |
| `bird_hide` → `public/assets/models/g3/regions/bird_hide.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：沈舟观鸟小屋；平直顶点色 |
| `heron_statue` → `public/assets/models/g3/regions/heron_statue.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 湿地：栖桩苍鹭；平直顶点色；颈部轻摆与转头观察；双足固定抓住木桩 |
| `highland_grass_a` → `public/assets/models/g3/regions/highland_grass_a.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：迎风长草；平直顶点色；三簇草叶错相迎风摆动 |
| `highland_grass_b` → `public/assets/models/g3/regions/highland_grass_b.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：金穗风草；平直顶点色；草叶与金穗一体迎风摆动 |
| `stone_wall_straight` → `public/assets/models/g3/regions/stone_wall_straight.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：干砌石墙直段；平直顶点色 |
| `stone_wall_corner` → `public/assets/models/g3/regions/stone_wall_corner.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：干砌石墙转角；平直顶点色 |
| `cairn` → `public/assets/models/g3/regions/cairn.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：叠石路标；平直顶点色 |
| `lookout_bench` → `public/assets/models/g3/regions/lookout_bench.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：高地观景长凳；平直顶点色 |
| `alpine_flower_a` → `public/assets/models/g3/regions/alpine_flower_a.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：银白高山花；平直顶点色 |
| `alpine_flower_b` → `public/assets/models/g3/regions/alpine_flower_b.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：紫蓝高山花；平直顶点色 |
| `wind_flag` → `public/assets/models/g3/regions/wind_flag.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 风车高地：高地风向旗；平直顶点色；旗根微摆、旗中与旗梢递进弯曲 |
| `stream_rock_a` → `public/assets/models/g3/regions/stream_rock_a.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 山溪：青灰溪中圆石；平直顶点色 |
| `stream_rock_b` → `public/assets/models/g3/regions/stream_rock_b.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 山溪：层纹溪石组；平直顶点色 |
| `small_waterfall` → `public/assets/models/g3/regions/small_waterfall.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 山溪：浅蓝叠水岩阶；平直顶点色 |
| `log_bridge` → `public/assets/models/g3/regions/log_bridge.glb` | 本项目 `job21/regions.py` 原创 | 项目自制，无新增第三方美术许可 | 山溪：剖面独木桥；平直顶点色 |


## G3 · 任务 22：G3 音乐与音效交付（任务 22，原文件 `assets-src/ledger/job22.md`）

完成 **14 个音乐／环境键、27 个音效键**。音效共 **83 个变体**：`step_snow` 保留 5 个，其余每键 3 个；合计 **97 个 OGG**，11,497,889 字节（10.97 MiB）。这是任务覆盖的成品总量，包含更新的 `night` 与 `step_snow`，并非全部净新增文件。

全部选用 **CC0 1.0**。新增下载 **19 个文件，来自 17 个来源页**；包含 2 个 ZIP，原包和解包文件均保留。来源页快照、下载直链、字节数、SHA-256 位于 `assets-src/vendor/oga/g3/licenses/`、`downloads.json`。鸭声与兔声明确使用公开 OGG 预览，不冒充原始 WAV。`Battle Sound Effects` 为多许可发布，本任务明确选择其中 CC0 授权。

### 逐键清单

下表路径相对 `public/assets/audio/`；花括号表示逐个编号的独立文件。作者、来源、授权与处理方式均逐键列出。生物动画、几何面数与关键帧不适用于音频；清单中的相应字段使用空值或空数组。

| 键 | 成品文件 | 作者与来源 | 许可证 | 取得方式、用途与处理 |
| --- | --- | --- | --- | --- |
| `summer` | `music/summer.ogg` | Juhani Junkala / SubspaceAudio [calm](https://opengameart.org/content/jrpg-pack-4-calm) | CC0 1.0 | 复用；夏日农场；Calm5 - Summer Memories；保留原生循环，与春季同作者同专辑 |
| `autumn` | `music/autumn.ogg` | Zane Little Music [autumn](https://opengameart.org/content/apple-cider) | CC0 1.0 | 复用；秋日农场；apple_cider.mp3；取 0–194 秒，6 秒首尾交叉衔接 |
| `winter` | `music/winter.ogg` | Juhani Junkala / SubspaceAudio [calm](https://opengameart.org/content/jrpg-pack-4-calm) | CC0 1.0 | 复用；冬日农场；Calm6 - Innocence；保留原生循环，降低峰值至约 -8 dBFS |
| `night` | `music/night.ogg` | Cal McEachern / Trex0n [night](https://opengameart.org/content/a-small-fire-will-do-calming-loop) | CC0 1.0 | 复用；安静夜晚；mp3.mp3；64 秒吉他循环，峰值约 -9 dBFS；更新既有同名键 |
| `deepforest` | `music/deepforest.ogg` | Samza [forest](https://opengameart.org/content/peaceful-forest) | CC0 1.0 | 新下载；深林探索；Peaceful Forest.wav；弦乐与低音，1.2 秒交叉衔接 |
| `wetland` | `music/wetland.ogg` | beardalaxy [wetland](https://opengameart.org/content/swamp-theme-loop) | CC0 1.0 | 新下载；空灵湿地；swamp_in_game.ogg；保留原生短循环，约 15.26 秒 |
| `highland` | `music/highland.ogg` | KiluaBoy [highland](https://opengameart.org/content/through-fire-through-sea-violin-flute-loop) | CC0 1.0 | 新下载；风车高地；ThroughSea.wav；长笛版本，38.4 秒原生循环 |
| `mine_iron` | `music/mine_iron.ogg` | mutantleg [cave](https://opengameart.org/content/cave-explorer)；Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；旧铁矿；G2 mine.ogg 降速至 0.88，叠加 impactMetal_light_000 的低沉回响 |
| `mine_frost` | `music/mine_frost.ogg` | cynicmusic / The Cynic Project [frost](https://opengameart.org/content/crystal-cave-song18) | CC0 1.0 | 新下载；寒晶深矿；song18_0.mp3；晶体铃音与琶音，120 毫秒交叉衔接 |
| `boss` | `music/boss.ogg` | request [boss](https://opengameart.org/content/heartfelt-battle-loopable-fantasy-stringspianohorn) | CC0 1.0 | 新下载；首领战；heartfelt-battle_loop.ogg；保留作者循环版，9 kHz 低通控制尖锐高频 |
| `amb_wind` | `music/amb_wind.ogg` | Luke.RUSTLTD [wind](https://opengameart.org/content/wind1) | CC0 1.0 | 新下载；高地风声；wind1.wav；2 秒交叉衔接，峰值约 -12 dBFS |
| `amb_wetland` | `music/amb_wetland.ogg` | LokiF [swamp](https://opengameart.org/content/swamp-environment-audio)；EZduzziteh [ribbit](https://opengameart.org/content/ribbit-frog-sounds) | CC0 1.0 | 新下载；湿地虫蛙；swamp_low_quality.wav 的 30–92 秒虫鸣气氛，叠加 ribbit_01/02/03 蛙鸣 |
| `amb_snow` | `music/amb_snow.ogg` | Luke.RUSTLTD [wind](https://opengameart.org/content/wind1) | CC0 1.0 | 新下载；雪地微风；wind1.wav 的 9–56 秒，0.82 倍速、1.8 kHz 低通，峰值约 -16 dBFS |
| `amb_rain_thunder` | `music/amb_rain_thunder.ogg` | rubberduck [water](https://opengameart.org/content/40-cc0-water-splash-slime-sfx)；rubberduck [foley](https://opengameart.org/content/100-cc0-sfx-2) | CC0 1.0 | 复用＋新下载；远雷雨幕；loop_rain 与 sfx100v2_thunder_01；35 秒雨幕内三次轻远雷 |
| `moo` | `sfx/moo_{0,1,2}.ogg` | Joseph SARDIN [cow](https://bigsoundbank.com/cow-moos-s0546.html) | CC0 1.0 | 新下载；牛叫；Cow Moos #1；分别取 1.20–2.38、3.62–5.20、6.22–7.95 秒真实叫声 |
| `baa` | `sfx/baa_{0,1,2}.ogg` | AntumDeluge / mikewest [sheep](https://opengameart.org/content/sheep-baa) | CC0 1.0 | 新下载；羊叫；sheep_baa.flac；0.96/1/1.04 倍速轻微音高变化 |
| `goat` | `sfx/goat_{0,1,2}.ogg` | Joseph SARDIN [goat](https://bigsoundbank.com/goat-2-s1381.html) | CC0 1.0 | 新下载；山羊叫；Goat #2；取 0.015–1.36 秒，0.96/1/1.04 倍速，6.5 kHz 低通 |
| `quack` | `sfx/quack_{0,1,2}.ogg` | Breviceps [quack](https://freesound.org/people/Breviceps/sounds/445960/) | CC0 1.0 | 新下载；鸭叫；Cartoon - Duck Quack；公开 OGG 预览，轻微音高与单叫/双叫变化 |
| `rabbit` | `sfx/rabbit_{0,1,2}.ogg` | kessir [rabbit_oinks](https://freesound.org/people/kessir/sounds/372075/) | CC0 1.0 | 新下载；兔子哼叫；Rabbit oinks and squeaks；公开 OGG 预览，三段不同真实兔声，6 kHz 低通 |
| `milk` | `sfx/milk_{0,1,2}.ogg` | rubberduck [water](https://opengameart.org/content/40-cc0-water-splash-slime-sfx)；Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用；挤奶入桶；splash_02/03/04 双连水滴与 metalPot1/2/3 轻桶鸣组合 |
| `shear` | `sfx/shear_{0,1,2}.ogg` | Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用；剪羊毛；knifeSlice、knifeSlice2、drawKnife1 与 metalClick；双连剪刀拟音 |
| `machine_mill` | `sfx/machine_mill_{0,1,2}.ogg` | rubberduck [foley](https://opengameart.org/content/100-cc0-sfx-2) | CC0 1.0 | 新下载；磨粉机；sfx100v2_loop_machine_02 三段，3.4 kHz 低通，每段约 1.75 秒循环 |
| `machine_loop` | `sfx/machine_loop_{0,1,2}.ogg` | rubberduck [foley](https://opengameart.org/content/100-cc0-sfx-2)；Kenney [interface](https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 复用＋新下载；织机；sfx100v2_loop_machine_01 三段与 tick_001/002/004，每段约 1.60 秒循环 |
| `bubble_pot` | `sfx/bubble_pot_{0,1,2}.ogg` | rubberduck [water](https://opengameart.org/content/40-cc0-water-splash-slime-sfx) | CC0 1.0 | 复用；锅中咕嘟；loop_bubbles_1、loop_bubbles_02；截短、轻微音高变化 |
| `bake` | `sfx/bake_{0,1,2}.ogg` | Kenney [rpg](https://kenney.nl/assets/rpg-audio)；rubberduck [foley](https://opengameart.org/content/100-cc0-sfx-2) | CC0 1.0 | 复用＋新下载；烤炉热气；doorOpen_1/2 与 sfx100v2_air_01；先门响后热气拟音 |
| `bees` | `sfx/bees_{0,1,2}.ogg` | Delta12 Studio [bees](https://opengameart.org/content/rpg-sound-effect-pack) | CC0 1.0 | 新下载；蜂箱嗡鸣；bee_2.ogg；延长嗡鸣，轻微音高与时长变化 |
| `sprinkler` | `sfx/sprinkler_{0,1,2}.ogg` | rubberduck [water](https://opengameart.org/content/40-cc0-water-splash-slime-sfx) | CC0 1.0 | 复用；喷灌喷水；loop_rain 三段；8/9/10 Hz 水流脉动，边缘淡化 |
| `thunder` | `sfx/thunder_{0,1,2}.ogg` | rubberduck [foley](https://opengameart.org/content/100-cc0-sfx-2) | CC0 1.0 | 新下载；低沉远雷；sfx100v2_thunder_01；0.85/0.93/1 倍速，1.1 kHz 低通和 300 毫秒缓起落 |
| `wind_gust` | `sfx/wind_gust_{0,1,2}.ogg` | Luke.RUSTLTD [wind](https://opengameart.org/content/wind1) | CC0 1.0 | 新下载；阵风；wind1.wav 三段；3.4 秒平滑风力包络 |
| `step_snow` | `sfx/step_snow_{0,1,2,3,4}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；雪地脚步；footstep_snow_000–004；保留五个不同源变体并归一化 |
| `ice_crack` | `sfx/ice_crack_{0,1,2}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；冰晶碎裂；impactGlass_heavy_000/001/002 与 impactBell_heavy_000/001/002 回响 |
| `metal_clank` | `sfx/metal_clank_{0,1,2}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；金属撞击；impactMetal_heavy_000/001/002；6.2 kHz 低通 |
| `boss_roar` | `sfx/boss_roar_{0,1,2}.ogg` | Joseph SARDIN [cow](https://bigsoundbank.com/cow-moos-s0546.html)；qubodup [insect](https://opengameart.org/content/insect-or-alien-scream) | CC0 1.0 | 复用＋新下载；首领低吼；真实牛声降调与气球放气制作的 insect.flac 混音、回响；无真人声 |
| `shockwave` | `sfx/shockwave_{0,1,2}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds)；rubberduck [foley](https://opengameart.org/content/100-cc0-sfx-2) | CC0 1.0 | 复用＋新下载；震波砸地；impactPunch_heavy、impactMining 的 000/001/002 与低通远雷尾音 |
| `projectile` | `sfx/projectile_{0,1,2}.ogg` | artisticdude [bow](https://opengameart.org/content/battle-sound-effects)；Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用＋新下载；晶刺射出；swish_2/3/4.wav 与 impactGlass_light_000/001/002；短破风加晶体瞬态 |
| `bow` | `sfx/bow_{0,1,2}.ogg` | artisticdude [bow](https://opengameart.org/content/battle-sound-effects)；Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用＋新下载；拉弓放箭；Bow.wav 与 creak1/2/3；先拉弓吱嘎，后弦响 |
| `campfire` | `sfx/campfire_{0,1,2}.ogg` | AntumDeluge [fire](https://opengameart.org/content/fire-crackling) | CC0 1.0 | 新下载；营火噼啪；fire-1.wav 三个选段；150 毫秒交叉衔接，约 2.0–2.4 秒循环 |
| `door_open` | `sfx/door_open_{0,1,2}.ogg` | Kenney [rpg](https://kenney.nl/assets/rpg-audio)；rubberduck [foley](https://opengameart.org/content/100-cc0-sfx-2) | CC0 1.0 | 复用＋新下载；开门；doorOpen_1、doorOpen_2、sfx100v2_door_03 三个不同开门声 |
| `build` | `sfx/build_{0,1,2}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；施工完成；impactWood_medium 与 impactMetal_medium 的 000/001/002；三次锤击 |
| `gift` | `sfx/gift_{0,1,2}.ogg` | Kenney [jingles](https://kenney.nl/assets/music-jingles) | CC0 1.0 | 复用；赠礼成功；jingles_PIZZI04/05/06；三个轻快拨弦提示 |
| `level_up` | `sfx/level_up_{0,1,2}.ogg` | Kenney [jingles](https://kenney.nl/assets/music-jingles) | CC0 1.0 | 复用；技能升级；jingles_PIZZI10/11/12；三个拨弦升级提示，保留旧 levelup 键 |

### 音源文件台账

| 来源编号 | 作者 | 链接 | 许可 | 取得方式 | 本地源文件或素材包 |
| --- | --- | --- | --- | --- | --- |
| calm | Juhani Junkala / SubspaceAudio | [calm](https://opengameart.org/content/jrpg-pack-4-calm) | CC0 1.0 | 复用 | `assets-src/vendor/oga/Calm5 - Summer Memories.ogg`<br>`assets-src/vendor/oga/Calm6 - Innocence.ogg` |
| autumn | Zane Little Music | [autumn](https://opengameart.org/content/apple-cider) | CC0 1.0 | 复用 | `assets-src/vendor/oga/apple_cider.mp3` |
| night | Cal McEachern / Trex0n | [night](https://opengameart.org/content/a-small-fire-will-do-calming-loop) | CC0 1.0 | 复用 | `assets-src/vendor/oga/mp3.mp3` |
| water | rubberduck | [water](https://opengameart.org/content/40-cc0-water-splash-slime-sfx) | CC0 1.0 | 复用 | `assets-src/vendor/oga/water-sfx/` |
| cave | mutantleg | [cave](https://opengameart.org/content/cave-explorer) | CC0 1.0 | 复用 | `assets-src/vendor/oga/g2/raw/caveexplorer_hq.mp3`<br>`assets-src/vendor/oga/g2/processed/music/mine.ogg` |
| insect | qubodup | [insect](https://opengameart.org/content/insect-or-alien-scream) | CC0 1.0 | 复用 | `assets-src/vendor/oga/g2/raw/insect.flac` |
| impact | Kenney | [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用 | `assets-src/vendor/kenney/impact-sounds/` |
| rpg | Kenney | [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用 | `assets-src/vendor/kenney/rpg-audio/` |
| interface | Kenney | [interface](https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 复用 | `assets-src/vendor/kenney/interface-sounds/` |
| jingles | Kenney | [jingles](https://kenney.nl/assets/music-jingles) | CC0 1.0 | 复用 | `assets-src/vendor/kenney/music-jingles/` |
| bees | Delta12 Studio | [bees](https://opengameart.org/content/rpg-sound-effect-pack) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/bees.ogg` |
| boss | request | [boss](https://opengameart.org/content/heartfelt-battle-loopable-fantasy-stringspianohorn) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/boss.ogg` |
| bow | artisticdude | [bow](https://opengameart.org/content/battle-sound-effects) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/bow.zip` |
| cow | Joseph SARDIN | [cow](https://bigsoundbank.com/cow-moos-s0546.html) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/cow.ogg` |
| fire | AntumDeluge | [fire](https://opengameart.org/content/fire-crackling) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/fire.wav` |
| foley | rubberduck | [foley](https://opengameart.org/content/100-cc0-sfx-2) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/foley.zip` |
| forest | Samza | [forest](https://opengameart.org/content/peaceful-forest) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/forest.wav` |
| frost | cynicmusic / The Cynic Project | [frost](https://opengameart.org/content/crystal-cave-song18) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/frost.mp3` |
| goat | Joseph SARDIN | [goat](https://bigsoundbank.com/goat-2-s1381.html) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/goat.ogg` |
| highland | KiluaBoy | [highland](https://opengameart.org/content/through-fire-through-sea-violin-flute-loop) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/highland.wav` |
| quack | Breviceps | [quack](https://freesound.org/people/Breviceps/sounds/445960/) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/quack-preview.ogg` |
| rabbit_oinks | kessir | [rabbit_oinks](https://freesound.org/people/kessir/sounds/372075/) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/rabbit-preview.ogg` |
| ribbit | EZduzziteh | [ribbit](https://opengameart.org/content/ribbit-frog-sounds) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/ribbit1.mp3`<br>`assets-src/vendor/oga/g3/raw/ribbit2.mp3`<br>`assets-src/vendor/oga/g3/raw/ribbit3.mp3` |
| sheep | AntumDeluge / mikewest | [sheep](https://opengameart.org/content/sheep-baa) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/sheep.flac` |
| swamp | LokiF | [swamp](https://opengameart.org/content/swamp-environment-audio) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/swamp.wav` |
| wetland | beardalaxy | [wetland](https://opengameart.org/content/swamp-theme-loop) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/wetland.ogg` |
| wind | Luke.RUSTLTD | [wind](https://opengameart.org/content/wind1) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g3/raw/wind.wav` |

### 处理与交付

- 一键重建：`python assets-src/blender/g3/job22/rebuild.py`，默认离线校验已有音源，不重复下载。
- 处理脚本复用 G2 的采样级读取辅助、混音、边缘淡化与交叉衔接算法；G3 编码保留峰值反馈过程中最接近目标的一次，避免短瞬态因 Vorbis 编码波动而超差。
- 44.1 kHz、双声道、OGG Vorbis；音乐与循环音效编码目标 96 kbps，其他短音效 128 kbps。单声道来源复制为双声道，不代表恢复立体声空间。
- 一次性音效加 8 毫秒淡化和编码块保护；循环先写显式 32 位 PCM WAV 临时文件，再由 Blender 编码，避免 aud 内存缓冲的末块杂音，保留原有时长。首尾在原时长内各预留 128 个保护采样，内侧加 8 毫秒余弦淡化，不追加片尾静音。Vorbis 首块解码可能裁去 128 个采样（约 2.90 毫秒）；报告分别记录容器采样数与实际解码数，并检查真实解码后的接缝。
- `sync_assets.py` 增加 G3 映射与预处理直拷分支；执行 `--audio-only`，不运行视觉同步。保留旧 `farm_summer`、`farm_autumn`、`farm_winter`、`levelup`、`door` 等键。
- 清单：`assets-src/manifests/job22.json`；联系表：`assets-src/previews/g3/job22/_contact_sheet.png`，另有音乐与音效分表；试听页：同目录 `index.html`，使用浏览器原生音频控件，可逐条试听、循环和执行解码自检。

### 自动验证

- 97 个成品均通过 Blender aud 与独立 FFmpeg 5.0.1 解码，核对采样数、44.1 kHz、双声道、非静音、无削波、PCM 变体差异和循环边界。源文件、运行时文件逐字节一致。
- 83 个音效峰值实测 **-3.448 至 -2.815 dBFS**；97 个文件首尾采样差最大 **0.00561575**（满幅为 1）。这只证明信号指标，不代替人工听感验收。
- 磨粉机 3 个变体约 1.75 秒；织机 3 个变体约 1.60 秒，符合 1–2 秒要求。两个索引包含全部 41 个任务键，并保留原有键。
- 源／运行时详细数值：`assets-src/vendor/oga/g3/verification-source.json`、`verification-runtime.json`。同步隔离、旧键保留和直拷幂等的检查见 `test_sync.py`；G2 回归沿用 `assets-src/tools/test_g2_audio.py`。
- G2/G3 共 6 项回归检查通过；再次同步前后，全部 226 个运行时音频文件及索引内容一致。127 个非本任务的既有 OGG 保持原哈希，共享视觉文件与总台账保持原哈希；并行源码变化单独记录于 `verification-scope.json`，本任务未覆盖它们。

### 自评与验收边界

- 资源、授权追溯、处理脚本、同步索引、清单和预览齐全。已逐格检查波形联系表；Edge 155 实际解码与接缝检查 97/97 通过；原生音频控件循环播放检查通过。浏览器证据见 `assets-src/previews/g3/job22/browser-verification.json`。
- `milk`、`shear`、`bake`、`sprinkler` 为明确标注的组合拟音；`boss_roar` 是牛声与气球拟虫声降调，不含人声。`wind` 为来源作者合成风声，湿地底层大部分为数字合成，不宣称真实野外录音。
- 羊、山羊、鸭、蜂声及弓声部分变体来自同一录音的轻微音高或节奏处理，并非每个都是独立录音。山羊源有较强饱和感；兔声保留少量录音底噪。鸭、兔使用有损预览，高频细节有限。
- 湿地配乐原生循环约 15 秒，营火循环约 2 秒，长时间单独播放可能察觉重复。秋季与深林曲采用交叉衔接；其乐句自然程度仍需听感判断。
- 未完成游戏内人工试听、场景切换和叠播听感验收，未运行整站构建。任务按要求不修改 `src/`；四季、矿层、机器持续播放与首领逻辑对新增键的接入状态，由并行游戏代码任务核验。现有 `sfx()` 为一次性播放，循环素材不等于已接入持续循环播放。


## G4 · 任务 24 资源来源与授权台账（任务 24，原文件 `assets-src/ledger/job24.md`）

51 个模型全部为项目内程序化原创，未下载、导入第三方模型；沿用项目许可，不额外宣称 CC0。

| ID | 文件 | 来源与许可 | 用途与制作说明 |
| --- | --- | --- | --- |
| wall_home_a | `public/assets/models/g4/interior/wall_home_a.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 家宅基础墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_home_b | `public/assets/models/g4/interior/wall_home_b.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 家宅装饰墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_home_window | `public/assets/models/g4/interior/wall_home_window.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 家宅窗墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_home_corner | `public/assets/models/g4/interior/wall_home_corner.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 家宅转角墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_home_shelf | `public/assets/models/g4/interior/wall_home_shelf.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 家宅置物墙；分件、低多边形倒角、顶点色；分类 wall |
| door_home | `public/assets/models/g4/interior/door_home.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 家宅敞门；分件、低多边形倒角、顶点色；分类 door |
| wall_shop_a | `public/assets/models/g4/interior/wall_shop_a.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 商店基础墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_shop_b | `public/assets/models/g4/interior/wall_shop_b.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 商店装饰墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_shop_window | `public/assets/models/g4/interior/wall_shop_window.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 商店窗墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_shop_corner | `public/assets/models/g4/interior/wall_shop_corner.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 商店转角墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_shop_shelf | `public/assets/models/g4/interior/wall_shop_shelf.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 商店置物墙；分件、低多边形倒角、顶点色；分类 wall |
| door_shop | `public/assets/models/g4/interior/door_shop.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 商店敞门；分件、低多边形倒角、顶点色；分类 door |
| wall_barn_a | `public/assets/models/g4/interior/wall_barn_a.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 畜棚基础墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_barn_b | `public/assets/models/g4/interior/wall_barn_b.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 畜棚装饰墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_barn_window | `public/assets/models/g4/interior/wall_barn_window.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 畜棚窗墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_barn_corner | `public/assets/models/g4/interior/wall_barn_corner.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 畜棚转角墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_barn_shelf | `public/assets/models/g4/interior/wall_barn_shelf.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 畜棚置物墙；分件、低多边形倒角、顶点色；分类 wall |
| door_barn | `public/assets/models/g4/interior/door_barn.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 畜棚敞门；分件、低多边形倒角、顶点色；分类 door |
| wall_stone_a | `public/assets/models/g4/interior/wall_stone_a.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 石砌基础墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_stone_b | `public/assets/models/g4/interior/wall_stone_b.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 石砌装饰墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_stone_window | `public/assets/models/g4/interior/wall_stone_window.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 石砌窗墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_stone_corner | `public/assets/models/g4/interior/wall_stone_corner.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 石砌转角墙；分件、低多边形倒角、顶点色；分类 wall |
| wall_stone_shelf | `public/assets/models/g4/interior/wall_stone_shelf.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 石砌置物墙；分件、低多边形倒角、顶点色；分类 wall |
| door_stone | `public/assets/models/g4/interior/door_stone.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 石砌敞门；分件、低多边形倒角、顶点色；分类 door |
| bed_single | `public/assets/models/g4/interior/bed_single.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 单人木床；分件、低多边形倒角、顶点色；分类 fixed |
| bed_double | `public/assets/models/g4/interior/bed_double.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 共居双人床；分件、低多边形倒角、顶点色；分类 fixed |
| kitchen_counter | `public/assets/models/g4/interior/kitchen_counter.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 厨房操作台；分件、低多边形倒角、顶点色；分类 fixed |
| kitchen_stove | `public/assets/models/g4/interior/kitchen_stove.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 铸铁灶台；分件、低多边形倒角、顶点色；分类 fixed |
| fridge_wood | `public/assets/models/g4/interior/fridge_wood.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 木制食物柜；分件、低多边形倒角、顶点色；分类 fixed |
| fireplace | `public/assets/models/g4/interior/fireplace.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 柴火壁炉；分件、低多边形倒角、顶点色；分类 fixed |
| wardrobe_mirror | `public/assets/models/g4/interior/wardrobe_mirror.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 衣柜穿衣镜；分件、低多边形倒角、顶点色；分类 fixed |
| stairs_up | `public/assets/models/g4/interior/stairs_up.glb` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 阁楼木楼梯；分件、低多边形倒角、顶点色；分类 fixed |
| table_dining | `public/assets/models/g4/interior/table_dining.glb`、`public/assets/icons/table_dining.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 暖木餐桌；分件、低多边形倒角、顶点色；分类 furniture |
| chair_wood | `public/assets/models/g4/interior/chair_wood.glb`、`public/assets/icons/chair_wood.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 木椅；分件、低多边形倒角、顶点色；分类 furniture |
| bookshelf | `public/assets/models/g4/interior/bookshelf.glb`、`public/assets/icons/bookshelf.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 藏书架；分件、低多边形倒角、顶点色；分类 furniture |
| cabinet_low | `public/assets/models/g4/interior/cabinet_low.glb`、`public/assets/icons/cabinet_low.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 双门矮柜；分件、低多边形倒角、顶点色；分类 furniture |
| nightstand | `public/assets/models/g4/interior/nightstand.glb`、`public/assets/icons/nightstand.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 床头柜；分件、低多边形倒角、顶点色；分类 furniture |
| lamp_table | `public/assets/models/g4/interior/lamp_table.glb`、`public/assets/icons/lamp_table.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 花边台灯；分件、低多边形倒角、顶点色；分类 furniture |
| lamp_floor | `public/assets/models/g4/interior/lamp_floor.glb`、`public/assets/icons/lamp_floor.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 暖光落地灯；分件、低多边形倒角、顶点色；分类 furniture |
| rug_large | `public/assets/models/g4/interior/rug_large.glb`、`public/assets/icons/rug_large.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 织花大地毯；分件、低多边形倒角、顶点色；分类 furniture |
| rug_small | `public/assets/models/g4/interior/rug_small.glb`、`public/assets/icons/rug_small.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 织花小地毯；分件、低多边形倒角、顶点色；分类 furniture |
| painting_wall | `public/assets/models/g4/interior/painting_wall.glb`、`public/assets/icons/painting_wall.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 山谷挂画；分件、低多边形倒角、顶点色；分类 furniture |
| table_bonsai | `public/assets/models/g4/interior/table_bonsai.glb`、`public/assets/icons/table_bonsai.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 盆景边桌；分件、低多边形倒角、顶点色；分类 furniture |
| chair_rocking | `public/assets/models/g4/interior/chair_rocking.glb`、`public/assets/icons/chair_rocking.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 藤垫摇椅；分件、低多边形倒角、顶点色；分类 furniture |
| sofa | `public/assets/models/g4/interior/sofa.glb`、`public/assets/icons/sofa.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 双人布沙发；分件、低多边形倒角、顶点色；分类 furniture |
| table_coffee | `public/assets/models/g4/interior/table_coffee.glb`、`public/assets/icons/table_coffee.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 圆角茶几；分件、低多边形倒角、顶点色；分类 furniture |
| piano_upright | `public/assets/models/g4/interior/piano_upright.glb`、`public/assets/icons/piano_upright.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 小立式钢琴；分件、低多边形倒角、顶点色；分类 furniture |
| radio | `public/assets/models/g4/interior/radio.glb`、`public/assets/icons/radio.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 木壳收音机；分件、低多边形倒角、顶点色；分类 furniture |
| window_flower_box | `public/assets/models/g4/interior/window_flower_box.glb`、`public/assets/icons/window_flower_box.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 窗台花箱；分件、低多边形倒角、顶点色；分类 furniture |
| clock_grandfather | `public/assets/models/g4/interior/clock_grandfather.glb`、`public/assets/icons/clock_grandfather.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 落地摆钟；分件、低多边形倒角、顶点色；分类 furniture |
| toy_chest | `public/assets/models/g4/interior/toy_chest.glb`、`public/assets/icons/toy_chest.png` | `assets-src/blender/g4/job24/models.py` 原创；项目许可 | 星星玩具箱；分件、低多边形倒角、顶点色；分类 furniture |

### 只读复用与预览

- `assets-src/blender/crops/geometry.py` 的 Mesh 与顶点色构造；`g2/shapes.py` 的 Model、beam、ring。
- `assets-src/blender/g3/job17/models.py` 的 bevel、lathe、flame；原文件不改。
- `assets-src/blender/crops/generate.py` 的 studio、frame、render、export；图标相机、Cycles 16 samples、灯光参数保持一致。
- `assets-src/blender/crops/build.py` 的 process_icon、fitted、font；仅重定向任务预览目录，未调用共享清单写入函数。
- `assets-src/blender/characters/glb_io.py` 只读解析 GLB。
- 对照图复用项目既有炉、箱、路灯 PNG；木箱既有 Kenney 来源见共享台账，本任务未重新分发其模型。
- 标注使用本机微软雅黑栅格化，不分发字体文件。
- 房间地板仅在预览场景程序化生成，不交付地板模型。


## G4 · Job25 小镇室内与新建筑授权台账（任务 25，原文件 `assets-src/ledger/job25.md`）

全部使用本地素材与项目已有管线，没有联网下载。
原创造型的第三方许可证：不适用；项目代码与资产权属沿用本项目约定，不擅自改为 CC0。

| 文件 | 来源 | 许可证 | 用途与改动 |
|---|---|---|---|---|
| `public/assets/models/g4/interior/counter_shop.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 收银柜台；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/seed_rack.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 种子袋陈列架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/shelf_goods.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 罐头布袋货架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/table_produce.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 时蔬展示桌；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/barrel_grain.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 谷物木桶；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/anvil.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 铁砧；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/forge_town.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 石砌锻炉；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/quench_tub.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 淬火桶；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/rack_tools_wall.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 工具墙架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/crate_ore.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 矿石木箱；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/workbench_carpenter.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 木工大工作台；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/sawhorse.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 锯木架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/rack_lumber.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 木料堆架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/chair_unfinished.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 半成品椅子；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/wood_shavings.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 卷曲刨花；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/counter_ranch.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 牧场柜台；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/feed_sacks.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 饲料麻袋堆；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/saddle_stand.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 马鞍架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/board_animals.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 动物照片板；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/bed_clinic.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 诊疗床；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/cabinet_medicine.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 玻璃门药柜；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/desk_herbalist.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 草药师书桌与研钵；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/screen_clinic.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 诊疗屏风；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/stove_diner.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 食堂大灶台；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/table_diner.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 食堂长餐桌；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/bench_diner.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 食堂长凳；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/board_menu.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 菜单黑板；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/rack_dishes.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 碗碟架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/counter_station.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 驿站服务柜台；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/sorter_mail.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 信件分拣格；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/crates_station.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 驿站货箱堆；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/bench_waiting.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 候车长椅；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/luggage.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 行李箱与旅行包；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/table_council.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 长会议桌；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/shelf_archives.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 档案高书架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/table_map.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 谷地地图桌；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/cabinet_archives.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 档案抽屉柜；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/lectern_council.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 议事厅讲台；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/desk_student.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 单人课桌椅；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/desk_teacher.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 教师讲台；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/board_classroom.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 教室黑板；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/cabinet_specimens.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 自然标本柜；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/globe.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 地球仪；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/stage_small.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 小舞台；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/easel_bailu.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 白露的画架；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/chairs_hall.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 活动厅长椅排；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/banner_hall.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 谷地挂旗；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/chair_wicker.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 老式藤椅；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/screen_embroidered.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 绣花屏风；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/bench_mine.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 矿口长凳；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/first_aid_box.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 急救箱；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/lamp_hanging.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 矿口挂灯；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/interior/stove_kettle.glb` | 项目程序化造型 | 项目原创，第三方许可证不适用 | 热水壶炉；米制建模、细节分件、顶点色、底面归零 |
| `public/assets/models/g4/buildings/school.glb` | 项目程序化造型；Kenney fantasy-town-kit：wall-door.glb、wall-window-glass.glb、wall.glb | Kenney 部分为 CC0 1.0；原创部分沿用项目权属 | 小镇教室；复用既有墙、窗、瓦面，新增钟楼/门廊/晒菜配件 |
| `public/assets/models/g4/buildings/community_hall.glb` | 项目程序化造型；Kenney fantasy-town-kit：wall-door.glb、wall-window-glass.glb、wall.glb | Kenney 部分为 CC0 1.0；原创部分沿用项目权属 | 公共活动厅；复用既有墙、窗、瓦面，新增钟楼/门廊/晒菜配件 |
| `public/assets/models/g4/buildings/house_c.glb` | 项目程序化造型；Kenney fantasy-town-kit：wall-wood-door.glb、wall-wood-window-shutters.glb、wall-wood.glb | Kenney 部分为 CC0 1.0；原创部分沿用项目权属 | 石婆的老屋；复用既有墙、窗、瓦面，新增钟楼/门廊/晒菜配件 |

### 只读复用依据

- `assets-src/vendor/kenney/fantasy-town-kit/License.txt`：Kenney CC0 1.0；建筑墙体/门窗及其内嵌调色板。
- `assets-src/blender/buildings/build.py`：建筑墙体、屋瓦、倒角与材质合并；不调用其入口和共享台账写入。
- `assets-src/blender/g3/job17/models.py`、`assets-src/blender/g2/shapes.py`、`assets-src/blender/crops/geometry.py`：网格、倒角、梁、圆环、器皿、火焰构件。
- `assets-src/blender/crops/generate.py`：顶点色、GLB 导出、既有三灯柔光与 45° 正交相机。
- 示例房间复用任务24墙块（实际来源记录见 `rooms.json`），地面仅作为预览布景；不交付墙体或地板模型。
- 同尺度图只读使用已有 `station.glb`、`house_a.glb`；预览、脚本和文档与模型沿用上述来源。


## G4 · 任务 26 资源来源与授权台账（任务 26，原文件 `assets-src/ledger/job26.md`）

12 件交付模型均为项目内程序化原创，未联网下载模型或贴图。项目自制内容沿用项目许可，不另行宣称 CC0。

| ID | 文件 | 来源 | 许可 | 用途与加工 |
| --- | --- | --- | --- | --- |
| feed_bench | `public/assets/models/g4/interior/feed_bench.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 低口沿、分块木板、铆钉压条与短脚；沿 X 轴每米一段；干草整体可隐藏。 |
| feed_trough_barn | `public/assets/models/g4/interior/feed_trough_barn.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 加高粗木支架、斜撑与后挡草栏；沿 X 轴每米一段；独立满槽干草。 |
| hay_hopper | `public/assets/models/g4/interior/hay_hopper.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 粗木储料仓、上接筒仓的金属短管、收口漏斗、拉闸与接料嘴。 |
| nest_box | `public/assets/models/g4/interior/nest_box.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 开口木格、后半遮棚、干草窝；鸡蛋、鸭蛋与兔绒共用槽位，按产物互斥显示。 |
| barn_stall | `public/assets/models/g4/interior/barn_stall.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 三面低栏、包铁柱脚、榫接横栏与散铺干草；正面开放供动物进出。 |
| water_bucket | `public/assets/models/g4/interior/water_bucket.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 厚壁木桶、铁箍、提梁、木握把、桶内浅蓝水面及细微波纹。 |
| heater_coop | `public/assets/models/g4/interior/heater_coop.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 铸铁暖炉、砖石隔热座、通风栅、炉门锁扣、短烟管；炉火独立 glow 材质。 |
| straw_floor_patch_a | `public/assets/models/g4/interior/straw_floor_patch_a.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 无底板的疏松圆形干草片；短草叶与少量穗头，贴地厚度不超过 5 厘米。 |
| straw_floor_patch_b | `public/assets/models/g4/interior/straw_floor_patch_b.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 无底板的偏斜长形干草片；不同疏密与朝向，贴地厚度不超过 5 厘米。 |
| perch | `public/assets/models/g4/interior/perch.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 双层圆木栖杆、两端斜脚架、横撑、金属连接钉与可见木端面。 |
| milk_station | `public/assets/models/g4/interior/milk_station.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 三脚挤奶凳、镀锡奶桶、乳白液面、木握把与搭边布巾。 |
| tool_hooks | `public/assets/models/g4/interior/tool_hooks.glb` | `assets-src/blender/g4/job26/models26.py` 原创造型 | 项目自制，沿用项目许可 | 粗木挂板、三个铁钩、带铰钉的剪毛剪与有刷毛和皮带的木刷。 |

### 只读复用

- `assets-src/blender/crops/geometry.py` 与 `g2/shapes.py`：既有网格、顶点色、木梁、圆环。
- `assets-src/blender/g3/job17/models.py`：既有 `bevel`、`lathe`，未修改原文件。
- `assets-src/blender/crops/generate.py`：既有平直着色、色彩转换和三盏柔光；本任务模型预览提高分辨率与采样，不生成图标。
- `assets-src/blender/characters/glb_io.py`：仅复用 GLB JSON 读取。
- 拼摆图只读使用既有 `g2/chicken.glb`、`g3/animals/{duck,rabbit,cow,sheep,goat}.glb`；来源与许可沿用项目 G2 / job19 台账。未把动物嵌入本次 GLB。
- 正式 job24 barn 墙存在时只读复用；否则程序化临时墙仅留在预览内存，不导出。实际来源见两份 `_room_*.json`。
- 本机微软雅黑仅用于 PNG 中文标注，不分发字体文件。
- 未修改 src、共享 manifest、共享台账、同步工具和其他任务目录。


## G4 · 任务 27：多树种资源授权台账（任务 27，原文件 `assets-src/ledger/job27.md`）

本任务所有正式模型为项目程序化原创；未下载新的模型或贴图，无新增第三方模型许可义务。
源造型：`assets-src/blender/g4/job27/trees.py`。导出与图标复用项目已有 crops 管线。
预览新旧对照只读使用 Kenney Nature Kit 2.1：CC0；许可原文位于 `assets-src/vendor/kenney/nature-kit/License.txt`。
对照中的旧模型为 tree_oak、tree_default、tree_detailed、tree_fat、tree_plateau，来自当前 src/render/models.ts 的树资源集合。
旧树预览采用 src/render/models.ts 的语义材质配色，仅在渲染场景中赋值；源模型不变。
标题文字由本机微软雅黑栅格化，交付不包含字体文件。

| id | 文件 | 来源与许可 | 用途与改动 |
|---|---|---|---|
| oak_spring | `public/assets/models/g4/trees/oak_spring.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| oak_summer | `public/assets/models/g4/trees/oak_summer.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| oak_autumn | `public/assets/models/g4/trees/oak_autumn.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| oak_winter | `public/assets/models/g4/trees/oak_winter.glb` | 项目原创 | 冬季枝干薄雪；常绿树针叶与贴面雪层 |
| oak_stump | `public/assets/models/g4/trees/oak_stump.glb` | 项目原创 | 断面、四圈年轮、裂纹与外露根系 |
| oak_sapling | `public/assets/models/g4/trees/oak_sapling.glb` | 项目原创 | 0.6 米幼苗与对应叶型 |
| oak_young | `public/assets/models/g4/trees/oak_young.glb` | 项目原创 | 2 米幼树，较小叶簇 |
| seed_oak | `public/assets/models/g4/trees/seed_oak.glb`；`public/assets/icons/seed_oak.png` | 项目原创 | 独立种子造型与统一管线图标 |
| maple_spring | `public/assets/models/g4/trees/maple_spring.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| maple_summer | `public/assets/models/g4/trees/maple_summer.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| maple_autumn | `public/assets/models/g4/trees/maple_autumn.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| maple_winter | `public/assets/models/g4/trees/maple_winter.glb` | 项目原创 | 冬季枝干薄雪；常绿树针叶与贴面雪层 |
| maple_stump | `public/assets/models/g4/trees/maple_stump.glb` | 项目原创 | 断面、四圈年轮、裂纹与外露根系 |
| maple_sapling | `public/assets/models/g4/trees/maple_sapling.glb` | 项目原创 | 0.6 米幼苗与对应叶型 |
| maple_young | `public/assets/models/g4/trees/maple_young.glb` | 项目原创 | 2 米幼树，较小叶簇 |
| seed_maple | `public/assets/models/g4/trees/seed_maple.glb`；`public/assets/icons/seed_maple.png` | 项目原创 | 独立种子造型与统一管线图标 |
| birch_spring | `public/assets/models/g4/trees/birch_spring.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| birch_summer | `public/assets/models/g4/trees/birch_summer.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| birch_autumn | `public/assets/models/g4/trees/birch_autumn.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| birch_winter | `public/assets/models/g4/trees/birch_winter.glb` | 项目原创 | 冬季枝干薄雪；常绿树针叶与贴面雪层 |
| birch_stump | `public/assets/models/g4/trees/birch_stump.glb` | 项目原创 | 断面、四圈年轮、裂纹与外露根系 |
| birch_sapling | `public/assets/models/g4/trees/birch_sapling.glb` | 项目原创 | 0.6 米幼苗与对应叶型 |
| birch_young | `public/assets/models/g4/trees/birch_young.glb` | 项目原创 | 2 米幼树，较小叶簇 |
| seed_birch | `public/assets/models/g4/trees/seed_birch.glb`；`public/assets/icons/seed_birch.png` | 项目原创 | 独立种子造型与统一管线图标 |
| pine_spring | `public/assets/models/g4/trees/pine_spring.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| pine_summer | `public/assets/models/g4/trees/pine_summer.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| pine_autumn | `public/assets/models/g4/trees/pine_autumn.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| pine_winter | `public/assets/models/g4/trees/pine_winter.glb` | 项目原创 | 冬季枝干薄雪；常绿树针叶与贴面雪层 |
| pine_stump | `public/assets/models/g4/trees/pine_stump.glb` | 项目原创 | 断面、四圈年轮、裂纹与外露根系 |
| pine_sapling | `public/assets/models/g4/trees/pine_sapling.glb` | 项目原创 | 0.6 米幼苗与对应叶型 |
| pine_young | `public/assets/models/g4/trees/pine_young.glb` | 项目原创 | 2 米幼树，较小叶簇 |
| seed_pine | `public/assets/models/g4/trees/seed_pine.glb`；`public/assets/icons/seed_pine.png` | 项目原创 | 独立种子造型与统一管线图标 |
| spruce_spring | `public/assets/models/g4/trees/spruce_spring.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| spruce_summer | `public/assets/models/g4/trees/spruce_summer.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| spruce_autumn | `public/assets/models/g4/trees/spruce_autumn.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| spruce_winter | `public/assets/models/g4/trees/spruce_winter.glb` | 项目原创 | 冬季枝干薄雪；常绿树针叶与贴面雪层 |
| spruce_stump | `public/assets/models/g4/trees/spruce_stump.glb` | 项目原创 | 断面、四圈年轮、裂纹与外露根系 |
| spruce_sapling | `public/assets/models/g4/trees/spruce_sapling.glb` | 项目原创 | 0.6 米幼苗与对应叶型 |
| spruce_young | `public/assets/models/g4/trees/spruce_young.glb` | 项目原创 | 2 米幼树，较小叶簇 |
| seed_spruce | `public/assets/models/g4/trees/seed_spruce.glb`；`public/assets/icons/seed_spruce.png` | 项目原创 | 独立种子造型与统一管线图标 |
| willow_spring | `public/assets/models/g4/trees/willow_spring.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| willow_summer | `public/assets/models/g4/trees/willow_summer.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| willow_autumn | `public/assets/models/g4/trees/willow_autumn.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| willow_winter | `public/assets/models/g4/trees/willow_winter.glb` | 项目原创 | 冬季枝干薄雪；常绿树针叶与贴面雪层 |
| willow_stump | `public/assets/models/g4/trees/willow_stump.glb` | 项目原创 | 断面、四圈年轮、裂纹与外露根系 |
| willow_sapling | `public/assets/models/g4/trees/willow_sapling.glb` | 项目原创 | 0.6 米幼苗与对应叶型 |
| willow_young | `public/assets/models/g4/trees/willow_young.glb` | 项目原创 | 2 米幼树，较小叶簇 |
| seed_willow | `public/assets/models/g4/trees/seed_willow.glb`；`public/assets/icons/seed_willow.png` | 项目原创 | 独立种子造型与统一管线图标 |
| cherry_wild_spring | `public/assets/models/g4/trees/cherry_wild_spring.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| cherry_wild_summer | `public/assets/models/g4/trees/cherry_wild_summer.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| cherry_wild_autumn | `public/assets/models/g4/trees/cherry_wild_autumn.glb` | 项目原创 | 连续弯曲枝干、分叉主枝、根部隆起与三层叶簇色阶 |
| cherry_wild_winter | `public/assets/models/g4/trees/cherry_wild_winter.glb` | 项目原创 | 冬季枝干薄雪；常绿树针叶与贴面雪层 |
| cherry_wild_stump | `public/assets/models/g4/trees/cherry_wild_stump.glb` | 项目原创 | 断面、四圈年轮、裂纹与外露根系 |
| cherry_wild_sapling | `public/assets/models/g4/trees/cherry_wild_sapling.glb` | 项目原创 | 0.6 米幼苗与对应叶型 |
| cherry_wild_young | `public/assets/models/g4/trees/cherry_wild_young.glb` | 项目原创 | 2 米幼树，较小叶簇 |
| seed_cherry_wild | `public/assets/models/g4/trees/seed_cherry_wild.glb`；`public/assets/icons/seed_cherry_wild.png` | 项目原创 | 独立种子造型与统一管线图标 |

全部动画字段为 `[]`：本任务无生物、无动画片段、无关键帧。
所有树木保留独立的 `leaves` 子节点，落叶树冬季该节点为空；`branches` 与 `snow` 独立。
各预览仅用于资源验收；正式游戏资源接入不属于本任务授权路径。


## G4 · 任务 28 授权与来源台账（任务 28，原文件 `assets-src/ledger/job28.md`）

全部造型由本任务脚本原创生成，未下载或导入第三方模型。沿用项目已有代码和顶点色调色板；授权归项目，未另行声明第三方许可证。
复用：`g2/shapes.py` 的网格与灯笼；`g3/job17/models.py` 的倒角、粮袋、火焰；`crops/generate.py` 摄影棚；`crops/build.py` 图标描边。只读引用，未修改。

| 文件 | 来源 | 许可证 | 用途与改动 |
|---|---|---|---|
| `public/assets/models/g4/festival/fishfest_banner.glb` | 项目原创程序化造型 | 项目自有 | 河岸开钓日／开钓彩旗；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/fishfest_scoreboard.glb` | 项目原创程序化造型 | 项目自有 | 河岸开钓日／计分木板；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/fishfest_podium.glb` | 项目原创程序化造型 | 项目自有 | 河岸开钓日／三阶领奖台；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/fishfest_stall.glb` | 项目原创程序化造型 | 项目自有 | 河岸开钓日／渔具摊位；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/deco_fishing_trophy.glb` | 项目原创程序化造型 | 项目自有 | 河岸开钓日／鱼形奖杯；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/deco_fishing_trophy.png` | 项目原创程序化造型 | 项目自有 | 河岸开钓日／鱼形奖杯；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/picnic_blanket.glb` | 项目原创程序化造型 | 项目自有 | 长日野餐／格子野餐布；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/picnic_blanket.png` | 项目原创程序化造型 | 项目自有 | 长日野餐／格子野餐布；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/picnic_basket.glb` | 项目原创程序化造型 | 项目自有 | 长日野餐／野餐篮；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/picnic_grill.glb` | 项目原创程序化造型 | 项目自有 | 长日野餐／野餐烤架；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/picnic_parasol.glb` | 项目原创程序化造型 | 项目自有 | 长日野餐／遮阳伞；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/picnic_pot.glb` | 项目原创程序化造型 | 项目自有 | 长日野餐／共享料理大锅；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/lantern_float.glb` | 项目原创程序化造型 | 项目自有 | 萤灯夜／漂浮河灯；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/lantern_marker.glb` | 项目原创程序化造型 | 项目自有 | 萤灯夜／灯影标记石灯；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/lantern_stand.glb` | 项目原创程序化造型 | 项目自有 | 萤灯夜／河岸灯架；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/deco_garden_lantern.glb` | 项目原创程序化造型 | 项目自有 | 萤灯夜／庭院灯；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/deco_garden_lantern.png` | 项目原创程序化造型 | 项目自有 | 萤灯夜／庭院灯；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/market_booth_player.glb` | 项目原创程序化造型 | 项目自有 | 田野集市／六位玩家展台；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/market_tent_a.glb` | 项目原创程序化造型 | 项目自有 | 田野集市／青麦帐篷；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/market_tent_b.glb` | 项目原创程序化造型 | 项目自有 | 田野集市／秋果帐篷；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/market_judge_table.glb` | 项目原创程序化造型 | 项目自有 | 田野集市／评审桌；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/deco_display_sign.glb` | 项目原创程序化造型 | 项目自有 | 田野集市／展示牌；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/deco_display_sign.png` | 项目原创程序化造型 | 项目自有 | 田野集市／展示牌；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/icons/festival_coin.png` | 项目原创程序化造型 | 项目自有 | 田野集市／集市纪念币；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/sort_bin_red.glb` | 项目原创程序化造型 | 项目自有 | 丰收协作日／红色分拣箱；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/sort_bin_yellow.glb` | 项目原创程序化造型 | 项目自有 | 丰收协作日／黄色分拣箱；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/sort_bin_green.glb` | 项目原创程序化造型 | 项目自有 | 丰收协作日／绿色分拣箱；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/harvest_cart.glb` | 项目原创程序化造型 | 项目自有 | 丰收协作日／丰收手推车；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/grain_sacks.glb` | 项目原创程序化造型 | 项目自有 | 丰收协作日／收获粮袋；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/deco_flower_box.glb` | 项目原创程序化造型 | 项目自有 | 丰收协作日／公共花箱；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/deco_flower_box.png` | 项目原创程序化造型 | 项目自有 | 丰收协作日／公共花箱；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/craft_bench_snow.glb` | 项目原创程序化造型 | 项目自有 | 雪地手作会／手作工作台；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/craft_parts.glb` | 项目原创程序化造型 | 项目自有 | 雪地手作会／五件拼装木件；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/snow_base.glb` | 项目原创程序化造型 | 项目自有 | 雪地手作会／雪景底座；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/deco_snow_house.glb` | 项目原创程序化造型 | 项目自有 | 雪地手作会／木雪屋摆件；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/deco_snow_house.png` | 项目原创程序化造型 | 项目自有 | 雪地手作会／木雪屋摆件；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/deco_sled.glb` | 项目原创程序化造型 | 项目自有 | 雪地手作会／木雪橇；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/deco_sled.png` | 项目原创程序化造型 | 项目自有 | 雪地手作会／木雪橇；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/deco_blanket_chair.glb` | 项目原创程序化造型 | 项目自有 | 雪地手作会／毛毯椅；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/deco_blanket_chair.png` | 项目原创程序化造型 | 项目自有 | 雪地手作会／毛毯椅；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/hearth_brazier.glb` | 项目原创程序化造型 | 项目自有 | 围炉谢礼夜／围炉大火盆；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/greeting_cabinet.glb` | 项目原创程序化造型 | 项目自有 | 围炉谢礼夜／公共问候柜；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/story_bench.glb` | 项目原创程序化造型 | 项目自有 | 围炉谢礼夜／故事长椅；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/deco_friend_keepsake.glb` | 项目原创程序化造型 | 项目自有 | 围炉谢礼夜／友情纪念摆件；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/icons/deco_friend_keepsake.png` | 项目原创程序化造型 | 项目自有 | 围炉谢礼夜／友情纪念摆件；分件、倒角、柔和顶点色；共用摄影棚与描边 |
| `public/assets/models/g4/festival/festival_arch_summer.glb` | 项目原创程序化造型 | 项目自有 | 四季会场／夏日绿荫拱门；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/festival_arch_autumn.glb` | 项目原创程序化造型 | 项目自有 | 四季会场／秋收麦穗拱门；分件、倒角、柔和顶点色；正式模型 |
| `public/assets/models/g4/festival/festival_arch_winter.glb` | 项目原创程序化造型 | 项目自有 | 四季会场／冬季雪松拱门；分件、倒角、柔和顶点色；正式模型 |


## G4 · 任务 29 资源来源与授权台账（任务 29，原文件 `assets-src/ledger/job29.md`）

42 件模型及其图标均为本项目程序化原创，未下载新素材、未拆用第三方模型。原创部分沿用项目许可，不另行宣称 CC0。

| ID / 中文名 | 模型及图标 | 来源 | 许可 | 用途及制作说明 |
| --- | --- | --- | --- | --- |
| decor_bench_wood / 木长椅 | `public/assets/models/g4/decor/decor_bench_wood.glb`；`public/assets/icons/decor_bench_wood.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；2×1格；纯色顶点色、分件轮廓；建议售价 180 金币 |
| decor_bench_stone / 石长椅 | `public/assets/models/g4/decor/decor_bench_stone.glb`；`public/assets/icons/decor_bench_stone.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；2×1格；纯色顶点色、分件轮廓；建议售价 260 金币 |
| decor_swing / 秋千 | `public/assets/models/g4/decor/decor_swing.glb`；`public/assets/icons/decor_swing.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；2×1格；纯色顶点色、分件轮廓；建议售价 480 金币 |
| decor_birdbath / 鸟浴盆 | `public/assets/models/g4/decor/decor_birdbath.glb`；`public/assets/icons/decor_birdbath.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 200 金币 |
| decor_sundial / 日晷 | `public/assets/models/g4/decor/decor_sundial.glb`；`public/assets/icons/decor_sundial.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 300 金币 |
| decor_weathervane / 风向鸡 | `public/assets/models/g4/decor/decor_weathervane.glb`；`public/assets/icons/decor_weathervane.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 240 金币 |
| decor_gazebo / 木质凉亭 | `public/assets/models/g4/decor/decor_gazebo.glb`；`public/assets/icons/decor_gazebo.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；2×2格；纯色顶点色、分件轮廓；建议售价 2200 金币 |
| decor_stone_lantern / 石灯笼 | `public/assets/models/g4/decor/decor_stone_lantern.glb`；`public/assets/icons/decor_stone_lantern.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 360 金币 |
| decor_flower_arch / 篱笆花拱门 | `public/assets/models/g4/decor/decor_flower_arch.glb`；`public/assets/icons/decor_flower_arch.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；2×1格；纯色顶点色、分件轮廓；建议售价 650 金币 |
| decor_well / 水井装饰小景 | `public/assets/models/g4/decor/decor_well.glb`；`public/assets/icons/decor_well.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 420 金币 |
| decor_stone_plinth / 石墩 | `public/assets/models/g4/decor/decor_stone_plinth.glb`；`public/assets/icons/decor_stone_plinth.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 90 金币 |
| decor_mailbox / 木质邮筒（装饰版） | `public/assets/models/g4/decor/decor_mailbox.glb`；`public/assets/icons/decor_mailbox.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 160 金币 |
| decor_scarecrow / 稻草人装饰版 | `public/assets/models/g4/decor/decor_scarecrow.glb`；`public/assets/icons/decor_scarecrow.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 220 金币 |
| decor_wheelbarrow / 手推车花坛 | `public/assets/models/g4/decor/decor_wheelbarrow.glb`；`public/assets/icons/decor_wheelbarrow.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 320 金币 |
| decor_path_light / 石头小径灯柱 | `public/assets/models/g4/decor/decor_path_light.glb`；`public/assets/icons/decor_path_light.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 180 金币 |
| decor_fountain / 小喷泉 | `public/assets/models/g4/decor/decor_fountain.glb`；`public/assets/icons/decor_fountain.png` | `assets-src/blender/g4/job29/outdoor.py` | 项目自制，沿用项目许可 | 地面装饰；2×2格；纯色顶点色、分件轮廓；建议售价 1800 金币 |
| decor_pot_cactus / 仙人掌 | `public/assets/models/g4/decor/decor_pot_cactus.glb`；`public/assets/icons/decor_pot_cactus.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 80 金币 |
| decor_pot_fern / 蕨类 | `public/assets/models/g4/decor/decor_pot_fern.glb`；`public/assets/icons/decor_pot_fern.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 100 金币 |
| decor_pot_olive / 小橄榄树 | `public/assets/models/g4/decor/decor_pot_olive.glb`；`public/assets/icons/decor_pot_olive.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 260 金币 |
| decor_pot_lavender / 薰衣草盆 | `public/assets/models/g4/decor/decor_pot_lavender.glb`；`public/assets/icons/decor_pot_lavender.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 120 金币 |
| decor_pot_sunflower / 向日葵盆 | `public/assets/models/g4/decor/decor_pot_sunflower.glb`；`public/assets/icons/decor_pot_sunflower.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 140 金币 |
| decor_pot_succulent / 多肉组盆 | `public/assets/models/g4/decor/decor_pot_succulent.glb`；`public/assets/icons/decor_pot_succulent.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 180 金币 |
| decor_pot_pine / 盆栽松 | `public/assets/models/g4/decor/decor_pot_pine.glb`；`public/assets/icons/decor_pot_pine.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 360 金币 |
| decor_pot_orchid / 蝴蝶兰 | `public/assets/models/g4/decor/decor_pot_orchid.glb`；`public/assets/icons/decor_pot_orchid.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 240 金币 |
| decor_pot_spider / 吊兰（挂盆） | `public/assets/models/g4/decor/decor_pot_spider.glb`；`public/assets/icons/decor_pot_spider.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 挂点装饰；1×1格；纯色顶点色、分件轮廓；建议售价 160 金币 |
| decor_pot_lemon / 柠檬盆栽 | `public/assets/models/g4/decor/decor_pot_lemon.glb`；`public/assets/icons/decor_pot_lemon.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 280 金币 |
| decor_pot_rose / 玫瑰盆 | `public/assets/models/g4/decor/decor_pot_rose.glb`；`public/assets/icons/decor_pot_rose.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 180 金币 |
| decor_pot_bamboo / 竹子盆 | `public/assets/models/g4/decor/decor_pot_bamboo.glb`；`public/assets/icons/decor_pot_bamboo.png` | `assets-src/blender/g4/job29/plants.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 200 金币 |
| decor_wall_lamp / 铁艺壁灯 | `public/assets/models/g4/decor/decor_wall_lamp.glb`；`public/assets/icons/decor_wall_lamp.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 墙面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 200 金币 |
| decor_paper_lantern / 纸灯笼 | `public/assets/models/g4/decor/decor_paper_lantern.glb`；`public/assets/icons/decor_paper_lantern.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 挂点装饰；1×1格；纯色顶点色、分件轮廓；建议售价 100 金币 |
| decor_oil_lamp / 油灯 | `public/assets/models/g4/decor/decor_oil_lamp.glb`；`public/assets/icons/decor_oil_lamp.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 桌面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 80 金币 |
| decor_candelabra / 烛台 | `public/assets/models/g4/decor/decor_candelabra.glb`；`public/assets/icons/decor_candelabra.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 桌面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 180 金币 |
| decor_mushroom_lamp / 蘑菇夜灯 | `public/assets/models/g4/decor/decor_mushroom_lamp.glb`；`public/assets/icons/decor_mushroom_lamp.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 桌面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 160 金币 |
| decor_star_lights / 星形串灯 | `public/assets/models/g4/decor/decor_star_lights.glb`；`public/assets/icons/decor_star_lights.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 地面装饰；2×1格；纯色顶点色、分件轮廓；建议售价 320 金币 |
| decor_fluorite_lamp / 萤石灯 | `public/assets/models/g4/decor/decor_fluorite_lamp.glb`；`public/assets/icons/decor_fluorite_lamp.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 桌面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 420 金币 |
| decor_hurricane_lamp / 风灯 | `public/assets/models/g4/decor/decor_hurricane_lamp.glb`；`public/assets/icons/decor_hurricane_lamp.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 桌面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 140 金币 |
| decor_farm_sign / 农场名牌 | `public/assets/models/g4/decor/decor_farm_sign.glb`；`public/assets/icons/decor_farm_sign.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 100 金币 |
| decor_boss_memorial / 首领纪念碑 | `public/assets/models/g4/decor/decor_boss_memorial.glb`；`public/assets/icons/decor_boss_memorial.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 600 金币 |
| decor_windmill_plaque / 风车纪念铜牌 | `public/assets/models/g4/decor/decor_windmill_plaque.glb`；`public/assets/icons/decor_windmill_plaque.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 墙面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 480 金币 |
| decor_harvest_trophy / 丰收奖杯 | `public/assets/models/g4/decor/decor_harvest_trophy.glb`；`public/assets/icons/decor_harvest_trophy.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 桌面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 500 金币 |
| decor_signature_board / 居民签名留言板 | `public/assets/models/g4/decor/decor_signature_board.glb`；`public/assets/icons/decor_signature_board.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 地面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 360 金币 |
| decor_season_frame / 四季纪念相框 | `public/assets/models/g4/decor/decor_season_frame.glb`；`public/assets/icons/decor_season_frame.png` | `assets-src/blender/g4/job29/ornaments.py` | 项目自制，沿用项目许可 | 墙面装饰；1×1格；纯色顶点色、分件轮廓；建议售价 420 金币 |

### 只读复用

- `assets-src/blender/g2/shapes.py`、`crops/geometry.py`：项目已有网格、木梁、圆环、折脊叶片及花瓣。
- `assets-src/blender/g3/job17/models.py`：项目已有倒角木板与旋转截面。
- `assets-src/blender/crops/generate.py`：原摄影棚，Cycles 16 samples、256px 透明底、正交方向 (6, -8, 10)、三盏柔光。
- `assets-src/blender/crops/build.py`：原 `process_icon`，100px 主体、128px RGBA、2px 深色描边，未修改任何共享参数。
- `assets-src/blender/characters/glb_io.py`：正式 GLB 的二进制读回。
- 图标对照中的木箱为已有 Kenney Survival Kit 资源（CC0，来源见共享 ASSET_LEDGER.md），其余五张参考为本项目已有资源；仅引用 PNG，不复制模型或变更原文件。
- 联系表使用本机微软雅黑栅格化中文标注，不分发字体文件。

### 接入边界

- 所有资源为静态装饰；不包含生物，不需要动画或关键帧。水流、秋千、风向鸡均为静态造型。
- 挂点与墙面资源仍以包围盒底面中心为原点；`mountAnchor` 为 GLB 的 Y 向上局部坐标。
- 喷泉水面为不透明纯色，独立 `glow` 材质覆盖八种灯具、石灯笼和小径灯柱。
- 建议售价是内容平衡输入，尚未接入商店或奖励系统。没有改动 src、共享清单、共享台账或同步脚本。


## G4 · job31 授权与用途台账（任务 31，原文件 `assets-src/ledger/job31.md`）

范围：4 个猫犬外观、2 件用品、6 位居民和 6 张头像。简报标题写 5 位，表格有 6 位，以表格为准。

| id | 交付文件 | 来源 / 许可 | 改造与用途 |
|---|---|---|---|
| cat | `public/assets/models/g4/pets/cat.glb` | 本项目脚本原创；按项目许可使用 | 原创猫犬轮廓、花色、表情和 7 段动画 |
| cat_b | `public/assets/models/g4/pets/cat_b.glb` | 本项目脚本原创；按项目许可使用 | 原创猫犬轮廓、花色、表情和 7 段动画 |
| dog | `public/assets/models/g4/pets/dog.glb` | 本项目脚本原创；按项目许可使用 | 原创猫犬轮廓、花色、表情和 7 段动画 |
| dog_b | `public/assets/models/g4/pets/dog_b.glb` | 本项目脚本原创；按项目许可使用 | 原创猫犬轮廓、花色、表情和 7 段动画 |
| pet_bowl | `public/assets/models/g4/pets/pet_bowl.glb` | 本项目脚本原创；按项目许可使用 | 陶瓷外壳与独立 food 节点 |
| pet_bed | `public/assets/models/g4/pets/pet_bed.glb` | 本项目脚本原创；按项目许可使用 | 降低前沿、围边、软垫、缝线 |
| child-a | `public/assets/models/characters/character-child-a.glb`；`public/assets/ui/chars/character-child-a.png` | Kenney Mini Characters（CC0）；`public/assets/models/characters/character-female-e.glb`；项目既有动作 | 0.8 倍、大头、短马尾、小书包 |
| elder-f | `public/assets/models/characters/character-elder-f.glb`；`public/assets/ui/chars/character-elder-f.png` | Kenney Mini Characters（CC0）；`public/assets/models/characters/character-female-d.glb`；项目既有动作 | 白发发髻、轻微驼背、深色布衫；拐杖为 torso 子物体 |
| elder-m | `public/assets/models/characters/character-elder-m.glb`；`public/assets/ui/chars/character-elder-m.png` | Kenney Mini Characters（CC0）；`public/assets/models/characters/character-male-a.glb`；项目既有动作 | 灰白短发、眼镜、衬衫和背心 |
| artist-f | `public/assets/models/characters/character-artist-f.glb`；`public/assets/ui/chars/character-artist-f.png` | Kenney Mini Characters（CC0）；`public/assets/models/characters/character-female-e.glb`；项目既有动作 | 贝雷帽、画笔及有颜料斑点的围裙 |
| scholar-m | `public/assets/models/characters/character-scholar-m.glb`；`public/assets/ui/chars/character-scholar-m.png` | Kenney Mini Characters（CC0）；`public/assets/models/characters/character-male-e.glb`；项目既有动作 | 眼镜、马甲、袖套 |
| teacher-f | `public/assets/models/characters/character-teacher-f.glb`；`public/assets/ui/chars/character-teacher-f.png` | Kenney Mini Characters（CC0）；`public/assets/models/characters/character-female-e.glb`；项目既有动作 | 开衫、长裙、长发 |

只读复用：

- `assets-src/vendor/kenney/mini-characters/License.txt`：Creative Commons Zero（CC0）；未联网下载素材。
- `assets-src/blender/characters/glb_io.py`：原 GLB 读写；保留已有骨架、逆绑定、挂点和所有动画二进制。
- `assets-src/blender/g3/job19/forms.py` 与 G2 `shapes.py/generate.py`：网格、连续管形、关节层级、动画写入。
- `assets-src/blender/crops/generate.py`：同一正交相机体系、Cycles 柔光和透明底渲染。
- 头像属于既有 64px 角色缩略图体系，不是物品的 128px 描边图标；未输出宠物物品图标。
- 预览中的原角色仅作风格与比例对照。新发型、衣饰、宠物和用品由本任务脚本制作，按项目许可使用。


## G4 · 任务 32：G4 音乐与音效交付（任务 32，原文件 `assets-src/ledger/job32.md`）

完成 **13 个音乐／环境键、17 个音效键，每个音效 3 个变体**，合计 **64 个 OGG、9,828,793 字节（9.37 MiB）**。30 个键均已进入运行时索引。全部使用 **CC0 1.0**。

新增下载 **12 个文件，来自 8 个来源页**，包括一个八音盒 ZIP；保留原包，只解包所用曲目。复用既有 Kenney、G2、G3 素材，不重复下载原有音频。Freesound 狗撒娇、欢呼和壁炉使用公开 OGG 预览，明确不作为原始 WAV。

### 逐键文件、作者、来源与许可

路径相对 `public/assets/audio/`；`{0,1,2}` 代表三个独立文件。几何、占地、动画不适用于音频，清单对应字段为空或零。

| 键 | 成品文件 | 作者与来源 | 许可 | 取得方式与处理 |
| --- | --- | --- | --- | --- |
| `fest_fishing` | `music/fest_fishing.ogg` | neonarkade [festival](https://opengameart.org/content/quaint-town) | CC0 1.0 | 复用；Quaint Town 循环版；保留轻快节奏，峰值 -6.5 dBFS |
| `fest_picnic` | `music/fest_picnic.ogg` | Juhani Junkala / SubspaceAudio [calm](https://opengameart.org/content/jrpg-pack-4-calm) | CC0 1.0 | 复用；Calm4 - Sand Castles；与现有春季同专辑，71.11 秒原生循环 |
| `fest_firefly` | `music/fest_firefly.ogg` | Aureolus_Omicron [musicbox](https://opengameart.org/node/136996) | CC0 1.0 | 新下载；musicbox2_cute_tune；温柔八音盒原生循环，8 kHz 低通 |
| `fest_market` | `music/fest_market.ogg` | RandomMind [market](https://opengameart.org/content/medieval-market-day) | CC0 1.0 | 复用；Loop_Market_Day；原生集市民谣循环，峰值 -7 dBFS |
| `fest_harvest` | `music/fest_harvest.ogg` | RandomMind [harvest](https://opengameart.org/content/medieval-harvest-season) | CC0 1.0 | 新下载；Harvest Season；取 23.88–151.88 秒主体，4 秒交叉衔接；器乐劳动节奏，无人声号子 |
| `fest_snow` | `music/fest_snow.ogg` | Emma_MA [snow](https://opengameart.org/content/wintery-loop) | CC0 1.0 | 新下载；Wintery loop；钢琴、玩具钢琴、木管与铃鼓，44.31 秒原生循环 |
| `fest_hearth` | `music/fest_hearth.ogg` | Cal McEachern / Trex0n [night](https://opengameart.org/content/a-small-fire-will-do-calming-loop) | CC0 1.0 | 复用；A Small Fire Will Do；64 秒温暖吉他，降低至 -10 dBFS |
| `ceremony` | `music/ceremony.ogg` | KiluaBoy [highland](https://opengameart.org/content/through-fire-through-sea-violin-flute-loop) | CC0 1.0 | 复用；ThroughSea；风车高地长笛主题以 0.9 倍速再现，42.67 秒温暖短循环 |
| `home` | `music/home.ogg` | Juhani Junkala / SubspaceAudio [calm](https://opengameart.org/content/jrpg-pack-4-calm) | CC0 1.0 | 复用；Calm1 - A Place I Call Home；6 kHz 低通，峰值 -10 dBFS |
| `shop` | `music/shop.ogg` | cynicmusic / The Cynic Project [town](https://opengameart.org/content/town-theme-rpg) | CC0 1.0 | 复用；TownTheme；竖琴与木管，取 0–96 秒并做 120 毫秒交叉衔接 |
| `amb_fire` | `music/amb_fire.ogg` | samarobryn [fireplace](https://freesound.org/people/samarobryn/sounds/414767/) | CC0 1.0 | 新下载；Crackling Fire 公开 OGG 预览；取 5–55 秒，2 秒交叉衔接，48 秒循环 |
| `amb_indoor` | `music/amb_indoor.ogg` | TinyWorlds [birds](https://opengameart.org/content/forest-ambience)；Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用；鸟鸣低通至 1.8 kHz，叠加 creak1/3 木屋轻响；33 秒组合环境 |
| `amb_barn` | `music/amb_barn.ogg` | TinyWorlds [birds](https://opengameart.org/content/forest-ambience)；Kenney [impact](https://kenney.nl/assets/impact-sounds)；Kenney [rpg](https://kenney.nl/assets/rpg-audio)；Joseph SARDIN [cow](https://bigsoundbank.com/cow-moos-s0546.html)；AntumDeluge / mikewest [sheep](https://opengameart.org/content/sheep-baa)；Breviceps [chicken](https://freesound.org/people/Breviceps/sounds/456803/) | CC0 1.0 | 复用；稀疏真实牛羊鸡声；草叶脚步与布料组合为干草拟音；33 秒循环 |
| `meow` | `sfx/meow_{0,1,2}.ogg` | Kerzoven [cat](https://opengameart.org/content/cat-purr-meow) | CC0 1.0 | 新下载；cat_mewfood 0.49–0.94 秒、cat_mewpurr 0.02–1.03 秒、cat_softmew 0.3–2.08 秒，三段独立录音 |
| `purr` | `sfx/purr_{0,1,2}.ogg` | Kerzoven [cat](https://opengameart.org/content/cat-purr-meow) | CC0 1.0 | 新下载；sleepy 0.3–2.7 秒、active 0.4–3.1 秒及 4.2–7.1 秒；160 毫秒交叉衔接 |
| `bark` | `sfx/bark_{0,1,2}.ogg` | Joseph SARDIN [bark](https://bigsoundbank.com/barking-dog-inside-s0112.html) | CC0 1.0 | 新下载；室内德国牧羊犬；取 0–0.58、0.78–1.35、1.43–2.0 秒，三次独立叫声 |
| `whine` | `sfx/whine_{0,1,2}.ogg` | Breviceps [whine](https://freesound.org/people/Breviceps/sounds/462660/) | CC0 1.0 | 新下载；Whining Dog 公开 OGG 预览；取 0.28–1.28、1.45–3.05、3.6–4.68 秒 |
| `door_wood_open` | `sfx/door_wood_open_{0,1,2}.ogg` | Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用；doorOpen_1/2 与 creak1/2/3；0.97/1/1.03 倍速及不同吱嘎组合 |
| `door_wood_close` | `sfx/door_wood_close_{0,1,2}.ogg` | Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用；doorClose_1/2/3；三个独立关门素材，6.2 kHz 低通 |
| `stairs` | `sfx/stairs_{0,1,2}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds)；Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用；footstep_wood_000/001/002 叠加 creak1/2/3，单步便于游戏按步触发 |
| `place_furniture` | `sfx/place_furniture_{0,1,2}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds)；Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用；cloth1/2/3 轻拖动，随后 impactWood_heavy_000/001/002 落地 |
| `timer_tick` | `sfx/timer_tick_{0,1,2}.ogg` | Kenney [interface](https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 复用；tick_001/002/004；短促滴答，6.5 kHz 低通 |
| `timer_end` | `sfx/timer_end_{0,1,2}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；impactBell_heavy_000/001/002；三连铃，4.8 kHz 低通避免刺耳 |
| `score_up` | `sfx/score_up_{0,1,2}.ogg` | Kenney [interface](https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 复用；pluck_001/002；第二音升大三度，三种间隔和微小音高变化 |
| `cheer` | `sfx/cheer_{0,1,2}.ogg` | Nox_Sound [cheer](https://freesound.org/people/Nox_Sound/sounds/752708/) | CC0 1.0 | 新下载；Small Crowd Cheer 公开 OGG 预览；0.97/1/1.03 倍速，5.2 kHz 低通与 150 毫秒淡化 |
| `lantern` | `sfx/lantern_{0,1,2}.ogg` | Kenney [rpg](https://kenney.nl/assets/rpg-audio)；AntumDeluge [fire](https://opengameart.org/content/fire-crackling)；Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；metalClick 锁扣、fire-1 三段火声与弱铃声组成点灯拟音 |
| `paper` | `sfx/paper_{0,1,2}.ogg` | Kenney [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用；bookFlip1/2/3；三段独立纸页声 |
| `sort_drop` | `sfx/sort_drop_{0,1,2}.ogg` | Kenney [rpg](https://kenney.nl/assets/rpg-audio)；Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；dropLeather 与 impactWood_medium_000/001/002，柔软物体落入木箱拟音 |
| `snow_crunch` | `sfx/snow_crunch_{0,1,2}.ogg` | Kenney [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用；footstep_snow_000–004；两段挤压组合、降调及不同间隔 |
| `wish` | `sfx/wish_{0,1,2}.ogg` | Kenney [jingles](https://kenney.nl/assets/music-jingles) | CC0 1.0 | 复用；jingles_STEEL01/02/03；钢片提示乐，4.2 kHz 低通，保留完整尾音 |

### 逐音源台账

| 编号 | 作者 | 来源页 | 许可 | 取得方式 | 实际使用的本地原料 |
| --- | --- | --- | --- | --- | --- |
| cat | Kerzoven | [cat](https://opengameart.org/content/cat-purr-meow) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g4/raw/cat_purrsleepy_loop.wav`<br>`assets-src/vendor/oga/g4/raw/cat_purractive_loop.wav`<br>`assets-src/vendor/oga/g4/raw/cat_mewfood.wav`<br>`assets-src/vendor/oga/g4/raw/cat_mewpurr.wav`<br>`assets-src/vendor/oga/g4/raw/cat_softmew.wav` |
| snow | Emma_MA | [snow](https://opengameart.org/content/wintery-loop) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g4/raw/wintery.wav` |
| musicbox | Aureolus_Omicron | [musicbox](https://opengameart.org/node/136996) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g4/raw/musicbox.zip`<br>`assets-src/vendor/oga/g4/raw/musicbox_cute.ogg` |
| harvest | RandomMind | [harvest](https://opengameart.org/content/medieval-harvest-season) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g4/raw/harvest.wav` |
| whine | Breviceps | [whine](https://freesound.org/people/Breviceps/sounds/462660/) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g4/raw/whine-preview.ogg` |
| cheer | Nox_Sound | [cheer](https://freesound.org/people/Nox_Sound/sounds/752708/) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g4/raw/cheer-preview.ogg` |
| bark | Joseph SARDIN | [bark](https://bigsoundbank.com/barking-dog-inside-s0112.html) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g4/raw/bark.ogg` |
| fireplace | samarobryn | [fireplace](https://freesound.org/people/samarobryn/sounds/414767/) | CC0 1.0 | 新下载 | `assets-src/vendor/oga/g4/raw/fireplace-preview.ogg` |
| calm | Juhani Junkala / SubspaceAudio | [calm](https://opengameart.org/content/jrpg-pack-4-calm) | CC0 1.0 | 复用 | `assets-src/vendor/oga/Calm1 - A Place I Call Home.ogg`<br>`assets-src/vendor/oga/Calm4 - Sand Castles.ogg` |
| festival | neonarkade | [festival](https://opengameart.org/content/quaint-town) | CC0 1.0 | 复用 | `assets-src/vendor/oga/Quaint Town - LOOPABLE.mp3` |
| market | RandomMind | [market](https://opengameart.org/content/medieval-market-day) | CC0 1.0 | 复用 | `assets-src/vendor/oga/Loop_Market_Day.mp3` |
| night | Cal McEachern / Trex0n | [night](https://opengameart.org/content/a-small-fire-will-do-calming-loop) | CC0 1.0 | 复用 | `assets-src/vendor/oga/mp3.mp3` |
| highland | KiluaBoy | [highland](https://opengameart.org/content/through-fire-through-sea-violin-flute-loop) | CC0 1.0 | 复用 | `assets-src/vendor/oga/g3/raw/highland.wav` |
| town | cynicmusic / The Cynic Project | [town](https://opengameart.org/content/town-theme-rpg) | CC0 1.0 | 复用 | `assets-src/vendor/oga/TownTheme.mp3` |
| birds | TinyWorlds | [birds](https://opengameart.org/content/forest-ambience) | CC0 1.0 | 复用 | `assets-src/vendor/oga/Forest_Ambience.mp3` |
| cow | Joseph SARDIN | [cow](https://bigsoundbank.com/cow-moos-s0546.html) | CC0 1.0 | 复用 | `assets-src/vendor/oga/g3/raw/cow.ogg` |
| sheep | AntumDeluge / mikewest | [sheep](https://opengameart.org/content/sheep-baa) | CC0 1.0 | 复用 | `assets-src/vendor/oga/g3/raw/sheep.flac` |
| chicken | Breviceps | [chicken](https://freesound.org/people/Breviceps/sounds/456803/) | CC0 1.0 | 复用 | `assets-src/vendor/oga/g2/raw/chicken-preview.ogg` |
| fire | AntumDeluge | [fire](https://opengameart.org/content/fire-crackling) | CC0 1.0 | 复用 | `assets-src/vendor/oga/g3/raw/fire.wav` |
| rpg | Kenney | [rpg](https://kenney.nl/assets/rpg-audio) | CC0 1.0 | 复用 | `assets-src/vendor/kenney/rpg-audio/Audio/bookFlip1.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/bookFlip2.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/bookFlip3.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/cloth1.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/cloth2.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/cloth3.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/creak1.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/creak2.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/creak3.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/doorClose_1.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/doorClose_2.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/doorClose_3.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/doorOpen_1.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/doorOpen_2.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/dropLeather.ogg`<br>`assets-src/vendor/kenney/rpg-audio/Audio/metalClick.ogg` |
| impact | Kenney | [impact](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | 复用 | `assets-src/vendor/kenney/impact-sounds/Audio/footstep_grass_000.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_grass_001.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_grass_002.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_snow_000.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_snow_001.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_snow_002.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_snow_003.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_snow_004.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_wood_000.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_wood_001.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/footstep_wood_002.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactBell_heavy_000.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactBell_heavy_001.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactBell_heavy_002.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactWood_heavy_000.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactWood_heavy_001.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactWood_heavy_002.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactWood_medium_000.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactWood_medium_001.ogg`<br>`assets-src/vendor/kenney/impact-sounds/Audio/impactWood_medium_002.ogg` |
| interface | Kenney | [interface](https://kenney.nl/assets/interface-sounds) | CC0 1.0 | 复用 | `assets-src/vendor/kenney/interface-sounds/Audio/pluck_001.ogg`<br>`assets-src/vendor/kenney/interface-sounds/Audio/pluck_002.ogg`<br>`assets-src/vendor/kenney/interface-sounds/Audio/tick_001.ogg`<br>`assets-src/vendor/kenney/interface-sounds/Audio/tick_002.ogg`<br>`assets-src/vendor/kenney/interface-sounds/Audio/tick_004.ogg` |
| jingles | Kenney | [jingles](https://kenney.nl/assets/music-jingles) | CC0 1.0 | 复用 | `assets-src/vendor/kenney/music-jingles/Audio/Steel jingles/jingles_STEEL01.ogg`<br>`assets-src/vendor/kenney/music-jingles/Audio/Steel jingles/jingles_STEEL02.ogg`<br>`assets-src/vendor/kenney/music-jingles/Audio/Steel jingles/jingles_STEEL03.ogg` |

### 处理与追溯

- `assets-src/vendor/oga/g4/sources.json` 锁定 23 个来源的作者、页面、授权快照及所有实际原料 SHA-256；`downloads.json` 保存下载直链、原包大小与哈希。`licenses/` 保存授权证据。
- 44.1 kHz、双声道、OGG Vorbis；音乐和呼噜循环目标 96 kbps，其他音效 128 kbps。单声道源复制双声道，不代表恢复空间信息。一次性音效边缘淡化，循环保留时长并加毫秒级编码保护。
- 使用 Blender aud/FFmpeg 复用 G3 采样处理器。G4 成品同步直接复制，避免二次转码增加帧尾静音；保留全部旧映射。只执行 `sync_assets.py --audio-only`。
- 一键重建：`python -X utf8 assets-src/blender/g4/job32/rebuild.py`。源文件校验默认离线；缺少新音源时可加 `--download` 恢复锁定版本。
- 清单：`assets-src/manifests/job32.json`；波形联系表、音乐分表、音效分表与试听页：`assets-src/previews/g4/job32/`。

### 实际验证

- 64/64 成品通过 Blender aud 与独立 FFmpeg 解码；检查声道、采样率、有限采样、非静音、无削波、不同变体 PCM 哈希、接缝和循环边缘能量。成品与运行时文件逐字节一致。
- 51 个音效峰值实测 **-3.420 至 -2.977 dBFS**；全部成品首尾采样差最大 **0.00752754**（满幅为 1）。音乐／环境循环 33–137.14 秒；欢呼均小于 2.5 秒。
- G2/G3/G4 共 9 项同步回归检查通过。**224 个旧 OGG 保持原哈希**；再次真实同步后 **290 个文件（含索引）内容一致**。其他观察到的并行文件变化见 `verification-scope.json`。
- 浏览器 Web Audio 实际解码、哈希及接缝检查 64/64 通过。浏览器：`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36`。
- 在支持 HTTP Range 的项目 Vite 服务下，13 条音乐／环境与 3 条呼噜从零开始、1 倍速完整播放并自然循环检查 16/16 通过；并发静音检查，不代表人工试听。
- 详细指标：`verification-source.json`、`verification-runtime.json`。浏览器报告与原生循环播放记录保存在预览目录。自动验证不代替人工听感验收。

### 自评与不足

- 资源、来源／许可追溯、处理脚本、同步映射、清单、联系表和试听入口均齐全。波形联系表用于逐键检查尾音、时长、响度和变体差异；不把图形检查当成试听。
- 开钓日复用花种会曲目，围炉复用夜间吉他，家中复用春季主题，商店复用小镇主题；仪式采用高地长笛主题慢速再现。保留统一风格，但不是十首新作；仪式的庄重感偏柔和。丰收曲是明快民谣器乐，劳动号子感来自节奏，不含人声号子。
- 部分木门、欢呼和提示音变体来自同一素材的微调／组合，并非全部独立录音。猫叫源有轻微录音底噪；狗撒娇、欢呼与壁炉为有损预览。畜棚干草、点灯、家具落地和分拣落箱为明确标注的组合拟音。
- 峰值控制通过，但未做统一 LUFS 母带；较密集的欢呼和持续呼噜需结合游戏触发音量评估。音乐交叉衔接的乐句自然度仍需人工试听确认。
- Chromium 155 对部分 OGG 的尾部跳转会使原生播放器重新估计时长，约多出 0.9 秒；正常从头播放与自然循环另行实测，未把尾部跳转结果冒充正常播放结果。试听服务需支持 HTTP Range，使用方法见 README。
- 未修改 `src/`，未执行整站构建及游戏内场景切换、叠播人工试听。现有 `sfx()` 为一次性播放；呼噜可循环素材不代表已接入持续循环逻辑。游戏触发接入由对应代码任务完成。


## G4 · 任务 33 来源与授权台账（任务 33，原文件 `assets-src/ledger/job33.md`）

原角色来自项目已有 Kenney Mini Characters（CC0）；原骨骼和农务动画来自项目现有角色管线。没有下载新素材。
新增织物、服装剪影、12 顶帽子为本项目程序化原创，沿用项目许可，不另行宣称 CC0。

| ID / 名称 | 文件 | 图标 | 来源与改动 |
| --- | --- | --- | --- |
| wear_top_linen / 亚麻白衬衫 | `public/assets/wear/top_linen.png` | `public/assets/icons/wear_top_linen.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_sky / 天蓝工装 | `public/assets/wear/top_sky.png` | `public/assets/icons/wear_top_sky.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_flannel / 红格子法兰绒 | `public/assets/wear/top_flannel.png` | `public/assets/icons/wear_top_flannel.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_knit / 墨绿针织毛衣 | `public/assets/wear/top_knit.png` | `public/assets/icons/wear_top_knit.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_navy / 海军蓝条纹衫 | `public/assets/wear/top_navy.png` | `public/assets/icons/wear_top_navy.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_mustard / 芥末黄上衣 | `public/assets/wear/top_mustard.png` | `public/assets/icons/wear_top_mustard.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_floral / 粉色碎花衫 | `public/assets/wear/top_floral.png` | `public/assets/icons/wear_top_floral.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_denim / 牛仔外套 | `public/assets/wear/top_denim.png` | `public/assets/icons/wear_top_denim.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_overalls / 橙色背带工装 | `public/assets/wear/top_overalls.png` | `public/assets/icons/wear_top_overalls.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_hoodie / 灰色卫衣 | `public/assets/wear/top_hoodie.png` | `public/assets/icons/wear_top_hoodie.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_stars / 星点夜空衫 | `public/assets/wear/top_stars.png` | `public/assets/icons/wear_top_stars.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_sakura / 春樱印花衫 | `public/assets/wear/top_sakura.png` | `public/assets/icons/wear_top_sakura.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_watermelon / 夏日西瓜衫 | `public/assets/wear/top_watermelon.png` | `public/assets/icons/wear_top_watermelon.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_leaves / 秋叶纹上衣 | `public/assets/wear/top_leaves.png` | `public/assets/icons/wear_top_leaves.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_snowflake / 冬雪花毛衣 | `public/assets/wear/top_snowflake.png` | `public/assets/icons/wear_top_snowflake.png` | 程序化原创；周期织物与衣物剪影 |
| wear_top_festival / 节庆彩条衫 | `public/assets/wear/top_festival.png` | `public/assets/icons/wear_top_festival.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_denim / 深蓝牛仔裤 | `public/assets/wear/bottom_denim.png` | `public/assets/icons/wear_bottom_denim.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_khaki / 卡其长裤 | `public/assets/wear/bottom_khaki.png` | `public/assets/icons/wear_bottom_khaki.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_black / 炭黑长裤 | `public/assets/wear/bottom_black.png` | `public/assets/icons/wear_bottom_black.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_work / 棕色工装裤 | `public/assets/wear/bottom_work.png` | `public/assets/icons/wear_bottom_work.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_plaid / 灰格长裤 | `public/assets/wear/bottom_plaid.png` | `public/assets/icons/wear_bottom_plaid.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_olive / 军绿长裤 | `public/assets/wear/bottom_olive.png` | `public/assets/icons/wear_bottom_olive.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_white / 米白长裤 | `public/assets/wear/bottom_white.png` | `public/assets/icons/wear_bottom_white.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_wine / 酒红长裤 | `public/assets/wear/bottom_wine.png` | `public/assets/icons/wear_bottom_wine.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_corduroy / 灯芯绒棕裤 | `public/assets/wear/bottom_corduroy.png` | `public/assets/icons/wear_bottom_corduroy.png` | 程序化原创；周期织物与衣物剪影 |
| wear_bottom_snow / 雪地防寒裤 | `public/assets/wear/bottom_snow.png` | `public/assets/icons/wear_bottom_snow.png` | 程序化原创；周期织物与衣物剪影 |
| wear_hat_straw / 田园草帽 | `public/assets/models/g4/wear/hat_straw.glb` | `public/assets/icons/wear_hat_straw.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_beanie / 毛线帽 | `public/assets/models/g4/wear/hat_beanie.glb` | `public/assets/icons/wear_hat_beanie.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_cap / 鸭舌帽 | `public/assets/models/g4/wear/hat_cap.glb` | `public/assets/icons/wear_hat_cap.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_bucket / 渔夫帽 | `public/assets/models/g4/wear/hat_bucket.glb` | `public/assets/icons/wear_hat_bucket.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_cowboy / 牛仔帽 | `public/assets/models/g4/wear/hat_cowboy.glb` | `public/assets/icons/wear_hat_cowboy.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_beret / 贝雷帽 | `public/assets/models/g4/wear/hat_beret.glb` | `public/assets/icons/wear_hat_beret.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_flower / 花冠 | `public/assets/models/g4/wear/hat_flower.glb` | `public/assets/icons/wear_hat_flower.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_chef / 厨师帽 | `public/assets/models/g4/wear/hat_chef.glb` | `public/assets/icons/wear_hat_chef.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_miner / 矿工头灯帽 | `public/assets/models/g4/wear/hat_miner.glb` | `public/assets/icons/wear_hat_miner.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_snow / 雪绒帽 | `public/assets/models/g4/wear/hat_snow.glb` | `public/assets/icons/wear_hat_snow.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_tophat / 礼帽 | `public/assets/models/g4/wear/hat_tophat.glb` | `public/assets/icons/wear_hat_tophat.png` | 程序化原创；独立分件低多边形帽子 |
| wear_hat_feather / 节庆羽毛帽 | `public/assets/models/g4/wear/hat_feather.glb` | `public/assets/icons/wear_hat_feather.png` | 程序化原创；独立分件低多边形帽子 |

### 角色派生文件

| 角色 | 模型 | 默认贴图 | 来源与改动 |
| --- | --- | --- | --- |
| male-a | `public/assets/models/characters/wear/character-male-a.glb` | `public/assets/wear/default/male-a_top.png`、`male-a_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| male-b | `public/assets/models/characters/wear/character-male-b.glb` | `public/assets/wear/default/male-b_top.png`、`male-b_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| male-c | `public/assets/models/characters/wear/character-male-c.glb` | `public/assets/wear/default/male-c_top.png`、`male-c_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| male-d | `public/assets/models/characters/wear/character-male-d.glb` | `public/assets/wear/default/male-d_top.png`、`male-d_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| male-e | `public/assets/models/characters/wear/character-male-e.glb` | `public/assets/wear/default/male-e_top.png`、`male-e_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| male-f | `public/assets/models/characters/wear/character-male-f.glb` | `public/assets/wear/default/male-f_top.png`、`male-f_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| female-a | `public/assets/models/characters/wear/character-female-a.glb` | `public/assets/wear/default/female-a_top.png`、`female-a_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| female-b | `public/assets/models/characters/wear/character-female-b.glb` | `public/assets/wear/default/female-b_top.png`、`female-b_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| female-c | `public/assets/models/characters/wear/character-female-c.glb` | `public/assets/wear/default/female-c_top.png`、`female-c_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| female-d | `public/assets/models/characters/wear/character-female-d.glb` | `public/assets/wear/default/female-d_top.png`、`female-d_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| female-e | `public/assets/models/characters/wear/character-female-e.glb` | `public/assets/wear/default/female-e_top.png`、`female-e_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |
| female-f | `public/assets/models/characters/wear/character-female-f.glb` | `public/assets/wear/default/female-f_top.png`、`female-f_bottom.png` | 同名原角色；仅追加 UV 接缝顶点与 256 图集，保留三角形形状、骨骼、绑定、挂点、45 段动画 |

### 只读复用

- `assets-src/blender/crops/generate.py`：原 Cycles 图标摄影棚、三灯与正交相机。
- `assets-src/blender/crops/build.py`：100 像素主体、128×128 RGBA、2 像素描边。
- `assets-src/blender/g2/shapes.py`、`crops/geometry.py`、`g3/job17/models.py`：已有网格、圆环、花瓣、倒角。
- `assets-src/blender/characters/glb_io.py`、`generate.py`：GLB 读写、角色与动作回读。
- 中文标签使用本机微软雅黑栅格化，没有分发字体文件。

### 接入边界

- 清单价格与获取来源为本任务内容配置；本任务未实施或验收商店、节庆及背包接入。
- 本任务只交付资产与 layout；遵照任务单没有修改 src 或共享清单。
- 保留原有头饰与发髻，帽子按 head 局部空间附着；原生尺寸之外的角色整体缩放由父节点继承。
- 512×512 原调色板按任务允许的例外缩至左上 128×128；默认外观经过重采样，不能宣称 PNG 像素逐位相同。
- 默认 64×64 是角色专用展开烘焙图；26 件可收集服装的 64×64 图案为无缝平铺。


## G4 · 任务 34：树根返工授权台账（任务 34，原文件 `assets-src/ledger/job34.md`）

来源：任务 27 的项目原创程序化模型；本次仍为项目原创。未下载或引入第三方模型、贴图、字体文件。
源生成器：`assets-src/blender/g4/job27/trees.py`；一键入口：`assets-src/blender/g4/job34/build.py`。
预览字体由本机微软雅黑栅格化；地面只用于审图，不进入正式 GLB。

修改 42 个 GLB（7 树种 × 四季成树、幼树、树桩）；7 个幼苗与 7 个种子 GLB 逐字节保留，全部图标保留。
所有文件路径、ID、原点、整体包围盒、节点名和节点变换均通过前后对比。

必要的衔接处理：原冬季独有细枝现由成树四季共享；为遵守四季一致性增加的上部几何来自原冬季模型。
旧白桦根尖曾穿出树桩切面；桩身和切面补偿 9.398 毫米以保留原总高，年轮图案、半径与材质保留。

| ID | 文件 | 旧 / 新三角形 | 来源与许可 |
|---|---|---:|---|
| oak_spring | `public/assets/models/g4/trees/oak_spring.glb` | 2208 / 2836 | 项目原创 |
| oak_summer | `public/assets/models/g4/trees/oak_summer.glb` | 2208 / 2836 | 项目原创 |
| oak_autumn | `public/assets/models/g4/trees/oak_autumn.glb` | 2208 / 2836 | 项目原创 |
| oak_winter | `public/assets/models/g4/trees/oak_winter.glb` | 1874 / 2022 | 项目原创 |
| oak_stump | `public/assets/models/g4/trees/oak_stump.glb` | 543 / 673 | 项目原创 |
| oak_young | `public/assets/models/g4/trees/oak_young.glb` | 2022 / 2074 | 项目原创 |
| maple_spring | `public/assets/models/g4/trees/maple_spring.glb` | 2220 / 2800 | 项目原创 |
| maple_summer | `public/assets/models/g4/trees/maple_summer.glb` | 2220 / 2800 | 项目原创 |
| maple_autumn | `public/assets/models/g4/trees/maple_autumn.glb` | 2220 / 2800 | 项目原创 |
| maple_winter | `public/assets/models/g4/trees/maple_winter.glb` | 1716 / 1864 | 项目原创 |
| maple_stump | `public/assets/models/g4/trees/maple_stump.glb` | 543 / 675 | 项目原创 |
| maple_young | `public/assets/models/g4/trees/maple_young.glb` | 2220 / 2272 | 项目原创 |
| birch_spring | `public/assets/models/g4/trees/birch_spring.glb` | 1890 / 2566 | 项目原创 |
| birch_summer | `public/assets/models/g4/trees/birch_summer.glb` | 1890 / 2566 | 项目原创 |
| birch_autumn | `public/assets/models/g4/trees/birch_autumn.glb` | 1890 / 2566 | 项目原创 |
| birch_winter | `public/assets/models/g4/trees/birch_winter.glb` | 2056 / 2204 | 项目原创 |
| birch_stump | `public/assets/models/g4/trees/birch_stump.glb` | 567 / 689 | 项目原创 |
| birch_young | `public/assets/models/g4/trees/birch_young.glb` | 1614 / 1666 | 项目原创 |
| pine_spring | `public/assets/models/g4/trees/pine_spring.glb` | 1594 / 1744 | 项目原创 |
| pine_summer | `public/assets/models/g4/trees/pine_summer.glb` | 1594 / 1744 | 项目原创 |
| pine_autumn | `public/assets/models/g4/trees/pine_autumn.glb` | 1594 / 1744 | 项目原创 |
| pine_winter | `public/assets/models/g4/trees/pine_winter.glb` | 1984 / 2134 | 项目原创 |
| pine_stump | `public/assets/models/g4/trees/pine_stump.glb` | 543 / 677 | 项目原创 |
| pine_young | `public/assets/models/g4/trees/pine_young.glb` | 1594 / 1648 | 项目原创 |
| spruce_spring | `public/assets/models/g4/trees/spruce_spring.glb` | 1910 / 2060 | 项目原创 |
| spruce_summer | `public/assets/models/g4/trees/spruce_summer.glb` | 1910 / 2060 | 项目原创 |
| spruce_autumn | `public/assets/models/g4/trees/spruce_autumn.glb` | 1910 / 2060 | 项目原创 |
| spruce_winter | `public/assets/models/g4/trees/spruce_winter.glb` | 2150 / 2300 | 项目原创 |
| spruce_stump | `public/assets/models/g4/trees/spruce_stump.glb` | 543 / 677 | 项目原创 |
| spruce_young | `public/assets/models/g4/trees/spruce_young.glb` | 1910 / 1964 | 项目原创 |
| willow_spring | `public/assets/models/g4/trees/willow_spring.glb` | 2392 / 2876 | 项目原创 |
| willow_summer | `public/assets/models/g4/trees/willow_summer.glb` | 2392 / 2876 | 项目原创 |
| willow_autumn | `public/assets/models/g4/trees/willow_autumn.glb` | 2392 / 2876 | 项目原创 |
| willow_winter | `public/assets/models/g4/trees/willow_winter.glb` | 1960 / 2108 | 项目原创 |
| willow_stump | `public/assets/models/g4/trees/willow_stump.glb` | 543 / 675 | 项目原创 |
| willow_young | `public/assets/models/g4/trees/willow_young.glb` | 2392 / 2444 | 项目原创 |
| cherry_wild_spring | `public/assets/models/g4/trees/cherry_wild_spring.glb` | 2328 / 2956 | 项目原创 |
| cherry_wild_summer | `public/assets/models/g4/trees/cherry_wild_summer.glb` | 2208 / 2836 | 项目原创 |
| cherry_wild_autumn | `public/assets/models/g4/trees/cherry_wild_autumn.glb` | 2208 / 2836 | 项目原创 |
| cherry_wild_winter | `public/assets/models/g4/trees/cherry_wild_winter.glb` | 1874 / 2022 | 项目原创 |
| cherry_wild_stump | `public/assets/models/g4/trees/cherry_wild_stump.glb` | 543 / 675 | 项目原创 |
| cherry_wild_young | `public/assets/models/g4/trees/cherry_wild_young.glb` | 2022 / 2074 | 项目原创 |

成树 1744–2956 三角形，满足本次 ≤3000；幼树与树桩仍执行原 ≤2500。
所有条目均为静态模型：动画片段与关键帧为空。
原校验：`assets-src/blender/g4/job27/validation.json`；返工范围校验：`assets-src/blender/g4/job34/validation.json`。
预览：`assets-src/previews/g4/job34/`；人工逐图审查与返工过程见同任务脚本目录的 `REVIEW.md`。
未修改游戏源码、共享清单和全局台账；未运行游戏内接入与交互流程。

## G4 · 任务 37：外圈远景树来源台账（任务 37，原文件 `assets-src/ledger/job37.md`）

来源：由本项目任务 27 原创树模型及任务 34 树根返工版本派生，项目自有。
未引入第三方模型或贴图；预览字体使用本机微软雅黑，仅栅格化到预览图。
保留节点、网格名称、tree_palette 材质、顶点色和米制原点；不添加动画。
当前 28 个输入均无 UV 或贴图，使用 COLOR_0；按原输入属性导出，不虚构调色板贴图。

| 文件 | 原三角形 | 远景三角形 | 缩减比例 |
|---|---:|---:|---:|
| `public/assets/models/g4/trees/far/oak_spring.glb` | 2836 | 798 | 71.86% |
| `public/assets/models/g4/trees/far/oak_summer.glb` | 2836 | 798 | 71.86% |
| `public/assets/models/g4/trees/far/oak_autumn.glb` | 2836 | 798 | 71.86% |
| `public/assets/models/g4/trees/far/oak_winter.glb` | 2022 | 560 | 72.30% |
| `public/assets/models/g4/trees/far/maple_spring.glb` | 2800 | 764 | 72.71% |
| `public/assets/models/g4/trees/far/maple_summer.glb` | 2800 | 764 | 72.71% |
| `public/assets/models/g4/trees/far/maple_autumn.glb` | 2800 | 764 | 72.71% |
| `public/assets/models/g4/trees/far/maple_winter.glb` | 1864 | 479 | 74.30% |
| `public/assets/models/g4/trees/far/birch_spring.glb` | 2566 | 674 | 73.73% |
| `public/assets/models/g4/trees/far/birch_summer.glb` | 2566 | 674 | 73.73% |
| `public/assets/models/g4/trees/far/birch_autumn.glb` | 2566 | 674 | 73.73% |
| `public/assets/models/g4/trees/far/birch_winter.glb` | 2204 | 582 | 73.59% |
| `public/assets/models/g4/trees/far/pine_spring.glb` | 1744 | 526 | 69.84% |
| `public/assets/models/g4/trees/far/pine_summer.glb` | 1744 | 526 | 69.84% |
| `public/assets/models/g4/trees/far/pine_autumn.glb` | 1744 | 526 | 69.84% |
| `public/assets/models/g4/trees/far/pine_winter.glb` | 2134 | 650 | 69.54% |
| `public/assets/models/g4/trees/far/spruce_spring.glb` | 2060 | 560 | 72.82% |
| `public/assets/models/g4/trees/far/spruce_summer.glb` | 2060 | 560 | 72.82% |
| `public/assets/models/g4/trees/far/spruce_autumn.glb` | 2060 | 560 | 72.82% |
| `public/assets/models/g4/trees/far/spruce_winter.glb` | 2300 | 640 | 72.17% |
| `public/assets/models/g4/trees/far/willow_spring.glb` | 2876 | 794 | 72.39% |
| `public/assets/models/g4/trees/far/willow_summer.glb` | 2876 | 794 | 72.39% |
| `public/assets/models/g4/trees/far/willow_autumn.glb` | 2876 | 794 | 72.39% |
| `public/assets/models/g4/trees/far/willow_winter.glb` | 2108 | 540 | 74.38% |
| `public/assets/models/g4/trees/far/cherry_wild_spring.glb` | 2956 | 789 | 73.31% |
| `public/assets/models/g4/trees/far/cherry_wild_summer.glb` | 2836 | 797 | 71.90% |
| `public/assets/models/g4/trees/far/cherry_wild_autumn.glb` | 2836 | 797 | 71.90% |
| `public/assets/models/g4/trees/far/cherry_wild_winter.glb` | 2022 | 559 | 72.35% |

重建入口：`python -B assets-src/blender/g4/job37/build.py`。
校验：`assets-src/blender/g4/job37/validation.json`；审图：同目录 `REVIEW.md`。
预览：`assets-src/previews/g4/job37/compare_<树种>.png` 与 `overview.png`。
仅交付离线资源；未修改游戏加载逻辑、其他模型或 dist，未运行游戏构建与浏览器流程。

## 网页图标（2026-10-16，上线审计 G01）

| 发行路径 | 来源 | 许可 | 说明 |
|---|---|---|---|
| `public/favicon.svg` | 本项目原创（Claude 手写 SVG：夜空底、四角星、两片新芽） | CC0（项目自有） | 替换此前误留的 Vite 模板图标；页面图标与 PWA 清单共用 |
| `public/icon-192.png`、`icon-512.png`、`icon-maskable-512.png`（八成安全区、满底色）、`apple-touch-icon.png` | 由 `public/favicon.svg` 在无头 Chrome 中按尺寸渲染导出 | CC0（项目自有） | PWA 安装图标、iOS 主屏图标 |
| `public/og.jpg`（1200×630） | 本游戏标题画面实机截图（生产包 1.0.0-rc.1，无头 Chrome WebGPU 渲染，隐藏菜单按钮）；画面内素材见本台账各批次 | 截图本身项目自有；画面内第三方素材均为 CC0 | 链接分享卡片（og:image） |
| ~~`public/icons.svg`~~ | Vite 模板残留的社交图标集合 | — | 游戏未使用，已从发行包删除 |
