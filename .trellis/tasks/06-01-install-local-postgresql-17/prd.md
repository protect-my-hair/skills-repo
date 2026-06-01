# Install local PostgreSQL 17 for skills-repo

## Goal

鍦ㄥ綋鍓?Windows 鏈満瀹夎涓€涓彲鐢ㄧ殑 PostgreSQL 17 瀹炰緥锛岃 `skills-repo` 鐨?`Prisma 7.8 + PostgreSQL` 鎶€鏈爤鍏峰鏈湴鏁版嵁搴撹繍琛屽熀纭€锛屽苟瀹屾垚鏈€灏忓彲鐢ㄩ獙鏀躲€?
## What I already know

* 浠撳簱褰撳墠鏁版嵁搴撴爤鏄?`Prisma 7.8 + PostgreSQL`銆?* `prisma/schema.prisma` 鐨?datasource provider 鏄?`postgresql`銆?* `.env.example` 瑕佹眰杩愯鏃朵娇鐢?`DATABASE_URL`锛岀己鐪佹椂鎵嶄細璧版湰鍦?JSON fallback銆?* `.trellis/spec/backend/database-guidelines.md` 娌℃湁瑕佹眰 `pgvector` 绛夐澶栨墿灞曘€?* 鏈満褰撳墠 `winget` 鍙敤锛屼絾灏氭湭鍙戠幇宸叉湁 PostgreSQL 鏈嶅姟锛宍psql` 涔熶笉鍦?PATH 涓€?* 褰撳墠缁堢涓嶆槸绠＄悊鍛樻潈闄愶紝鍥犳鍘熺敓瀹夎闃舵鍙兘闇€瑕佺郴缁熸彁鏉冦€?* 鐢ㄦ埛宸叉槑纭€夋嫨鈥滄柟妗?1鈥濓細鏈満鍘熺敓瀹夎 PostgreSQL 17銆?
## Assumptions (temporary)

* 瀹夎婧愰噰鐢ㄥ畼鏂?Windows 鍒嗗彂娓犻亾锛屽搴?`winget` 涓殑
  `PostgreSQL.PostgreSQL.17`銆?* 瀹夎杩囩▼涓渶瑕佺殑鏁版嵁搴?superuser 瀵嗙爜鐢辩敤鎴峰湪鏈満浜や簰寮忓畨瑁呯晫闈腑杈撳叆銆?* 鏈换鍔′笉鎶婄湡瀹炲瘑鐮併€佽繛鎺ヤ覆鎴?secret 鍐欏叆浠撳簱銆佷换鍔℃枃妗ｆ垨鑱婂ぉ杈撳嚭銆?
## Requirements

* 鍦ㄦ湰鏈哄畨瑁?PostgreSQL 17銆?* 瀹夎瀹屾垚鍚庡瓨鍦ㄥ彲杩愯鐨?PostgreSQL Windows 鏈嶅姟銆?* 鏈満鍙娇鐢?`psql` 鎴栫瓑鏁堟柟寮忕‘璁ゅ疄渚嬪彲杩炴帴銆?* 缁欏嚭閫傜敤浜?`skills-repo` 鐨勬湰鍦?`DATABASE_URL` 妯℃澘銆?* 涓嶅湪浠撳簱涓啓鍏ョ湡瀹炴暟鎹簱瀵嗙爜鎴?secret銆?
## Acceptance Criteria

* [ ] 鏈満宸插畨瑁?PostgreSQL 17銆?* [ ] PostgreSQL 鏈嶅姟瀛樺湪骞跺浜庡彲杩愯鐘舵€併€?* [ ] 鑳藉湪鏈満纭 `psql --version` 鍜屾暟鎹簱杩為€氭€с€?* [ ] 宸叉暣鐞嗗嚭 `skills-repo` 鍙敤鐨勬湰鍦拌繛鎺ヤ覆妯℃澘銆?
## Definition of Done

* 瀹夎姝ラ瀹屾垚銆?* 鏈満鏈嶅姟鍜?CLI 楠岃瘉瀹屾垚銆?* 杈撳嚭鍚庣画缁?`skills-repo` 浣跨敤鐨勬渶灏忛厤缃鏄庛€?
## Technical Approach

浣跨敤瀹樻柟 Windows 瀹夎娓犻亾瀹夎 PostgreSQL 17锛屼紭鍏堥€氳繃 `winget` 鎷夎捣瀹夎鍣紱
瀹夎鍚庢鏌?Windows 鏈嶅姟銆丆LI 鍙敤鎬у拰榛樿绔彛杩為€氭€э紝鍐嶆暣鐞嗛」鐩彲鐢ㄧ殑
`DATABASE_URL`銆?
## Decision (ADR-lite)

**Context**: 鐢ㄦ埛闇€瑕佹寜 `skills-repo` 褰撳墠鎶€鏈爤鍦ㄦ湰鏈哄噯澶?PostgreSQL銆?
**Decision**: 閲囩敤鏈満鍘熺敓瀹夎 PostgreSQL 17銆?
**Consequences**: 涓?Prisma/PostgreSQL 鏈湴寮€鍙戝満鏅渶璐磋繎锛屼絾瀹夎鏃跺彲鑳介渶瑕?Windows 鎻愭潈鍜岀敤鎴疯緭鍏ユ湰鍦版暟鎹簱瀵嗙爜銆?
## Out of Scope

* 涓嶅湪鏈换鍔″唴鎶婄湡瀹?`DATABASE_URL` 鍐欏叆浠撳簱鏂囦欢銆?* 涓嶅湪鏈换鍔″唴瀹屾垚杩滅▼鐢熶骇鏁版嵁搴撻儴缃层€?* 涓嶉澶栧畨瑁呬笌褰撳墠浠撳簱鏃犲叧鐨勬暟鎹簱鎵╁睍銆?
## Technical Notes

* Relevant files:
  `package.json`, `prisma/schema.prisma`, `.env.example`,
  `.trellis/spec/backend/database-guidelines.md`
* Official references:
  PostgreSQL Windows download/install docs, Prisma PostgreSQL connection URL docs
