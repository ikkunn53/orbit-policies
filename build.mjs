import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const c=JSON.parse(await readFile(join(root,'site-config.json'),'utf8'));
const draft=process.argv.includes('--draft');
const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
if(!c.serviceName?.trim()||!c.operatorName?.trim())throw Error('Public service and operator names are required.');
if(c.contactEmail&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(c.contactEmail))throw Error('Invalid contactEmail.');
if(c.contactUrl&&new URL(c.contactUrl).protocol!=='https:')throw Error('contactUrl must use HTTPS.');
if(!draft&&!c.contactEmail&&!c.contactUrl)throw Error('Publication blocked: provide an actual support/deletion email or HTTPS contact URL in site-config.json.');
if(new URL(c.baseUrl).protocol!=='https:'||!c.baseUrl.endsWith('/'))throw Error('baseUrl must be an HTTPS URL ending in /.');
if(!/^\d{4}-\d{2}-\d{2}$/.test(c.effectiveDate))throw Error('effectiveDate must be YYYY-MM-DD.');
const service=escape(c.serviceName),operator=escape(c.operatorName);
const contact= c.contactEmail?`<a href="mailto:${escape(c.contactEmail)}">${escape(c.contactEmail)}</a>`:c.contactUrl?`<a href="${escape(c.contactUrl)}">${escape(c.contactUrl)}</a>`:'<strong class="missing">連絡先未設定 / Contact pending — NOT FOR PUBLICATION</strong>';
const text={
 ja:{home:'サービスについて',privacy:'プライバシーポリシー',terms:'利用規約',contact:'問い合わせ・削除依頼',updated:'制定・最終更新',lang:'English',title:'運営方針とデータの取り扱い',summary:'Discordサーバー運営のための、閲覧制限付き分析サービス。',private:'分析画面は運営担当者限定',consent:'特別集計は本人の同意が前提',public:'このサイトはポリシーのみ公開',footer:'本サービスは独立したサービスであり、Discord Inc.の公式サービス・認定を示すものではありません。'},
 en:{home:'About',privacy:'Privacy Policy',terms:'Terms of Service',contact:'Contact & deletion',updated:'Effective / last updated',lang:'日本語',title:'Policies and data practices',summary:'Restricted-access analytics for Discord server administration.',private:'Analytics restricted to authorized administrators',consent:'Consent required for targeted message analysis',public:'This public site contains policies only',footer:'This is an independent service and is not an official Discord Inc. service or a statement of endorsement.'}
};
const list=items=>`<ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
const section=(title,body)=>`<section><h2>${title}</h2>${body}</section>`;
const p=value=>`<p>${value}</p>`;
function content(lang,page){
 const en=lang==='en';
 if(page==='home')return `
  <div class="intro"><span class="eyebrow">${service} · POLICY CENTER</span><h1>${text[lang].title}</h1>${p(text[lang].summary)}</div>
  <div class="facts">${[text[lang].private,text[lang].consent,text[lang].public].map(x=>`<span>${x}</span>`).join('')}</div>
  ${section(en?'Purpose and access':'利用目的と閲覧範囲',p(en?`${service} supports server administration, community activity measurement and investigation of abuse. Analytics and CSV exports are available only to the server owner or accounts with Discord Administrator permission for a server with the bot installed. An ordinary moderator role alone does not grant access.`:`${service}は、サーバー運営、コミュニティ活動の把握、荒らし等への対応を支援します。分析画面とCSV出力は、Botを導入したサーバーのオーナー、またはDiscordのAdministrator権限を持つアカウントに限定します。一般的なモデレーターロールだけでは閲覧できません。`))}
  <div class="cards">${['privacy','terms','contact'].map(key=>`<a class="card" href="${key}/"><span>${text[lang][key]}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>
  ${section(en?'Operator':'運営者',p(operator)+p(en?'For privacy questions, consent withdrawal or deletion requests, use the contact page.':'個人情報の取り扱い、同意の撤回、削除依頼は問い合わせページからご連絡ください。'))}`;
 if(page==='privacy')return `
  <h1>${text[lang].privacy}</h1>
  ${section(en?'1. Scope and operator':'1. 適用範囲と運営者',p(en?`This policy applies to ${service}, operated by ${operator}. It covers the Discord application, its restricted analytics website and this public policy site. Contact: ${contact}.`:`本ポリシーは、${operator}が運営する${service}のDiscordアプリ、閲覧制限付き分析Web、およびこのポリシーサイトに適用されます。連絡先：${contact}。`))}
  ${section(en?'2. Data collected':'2. 取得する情報',list(en?[
   'Discord user, server, channel, role, thread and message identifiers; names, avatars, roles, membership changes and bot indicators.',
   'Message metadata and counts, mentions and reply references; reaction counts, emoji and identifiers of reacting or replying users where needed for unique counts and moderation records.',
   'Voice/stage channel joins, leaves, moves and connection durations; observable streaming/camera state and aggregate usage. We do not record voice audio, video or camera images.',
   'Available invite codes, creators and estimated join/leave attribution; available role, thread, stage, scheduled-event, boost and moderation-event metadata.',
   'For explicitly registered special-analysis targets only: accessible message text, message/channel IDs, timestamps and response metrics, after consent is obtained from the target.',
   'Discord OAuth account/profile information, server authorization information, session cookies and operational/security logs needed to authenticate users and operate the service.'
  ]:[
   'Discordのユーザー・サーバー・チャンネル・ロール・スレッド・投稿のID、名前、アイコン、ロール、在籍状況、Bot判定等。',
   '投稿のメタデータ・件数、メンション・返信関係、リアクション件数・絵文字、および重複を除いた人数や管理記録に必要な反応・返信ユーザーの識別情報。',
   'VC・ステージへの参加・退出・移動日時、接続時間、観測可能な配信・カメラ状態と利用集計。音声・映像・カメラ画像は記録しません。',
   '取得可能な招待コード・作成者・参加退出経路の推定、ロール・スレッド・ステージ・予定イベント・ブースト・管理イベント等のメタデータ。',
   '本人同意を得て特別集計の対象として明示的に登録したユーザーに限り、アクセス可能な投稿本文、投稿・チャンネルID、日時、投稿への反応指標。',
   '認証に必要なDiscord OAuthのアカウント・プロフィール情報、サーバーの権限情報、セッションCookie、運用・セキュリティログ。'
  ]))}
  ${section(en?'3. Purposes and limits':'3. 利用目的と範囲',p(en?'We use data for server administration, aggregate activity measurement, consent-based measurement of responses to a target’s posts, investigation of abuse and operation/security of the service. Individual activity logs and, where enabled, user-pair reply/reaction counts may be used for these administrative purposes. We do not use the data for advertising, sale, AI model training or inferring sensitive personal traits. Ordinary analytics does not save message text. The bot does not read private direct messages as part of this service.':'取得情報は、サーバー運営、活動の集計、本人が同意した投稿の効果測定、荒らし等の調査、サービスの運用・安全確保に利用します。個人別の行動履歴や、有効にしている場合のユーザー間の返信・反応件数も、この管理目的の範囲で扱います。広告、販売、AIモデル学習、センシティブな個人属性の推測には利用しません。通常集計では投稿本文を保存せず、このサービスの収集対象として個人間のDMを読み取りません。'))}
  ${section(en?'4. Consent for special analysis':'4. 特別集計の同意',p(en?'The operator must obtain and retain the target’s informed consent before registering them for message-text collection, including an explanation of the purpose, access scope and retention. Consent and withdrawal are handled by the operator; the application does not currently provide a self-service consent form. A target may withdraw consent through the contact channel. The operator will stop targeted collection and remove the associated special-analysis data after verifying the request. This does not automatically remove separate ordinary moderation records; these can be included in a deletion request. Server administrator permission is not a substitute for the target’s consent or Discord’s required intent approval.':'運営者は、対象者へ目的・閲覧範囲・保存期間を説明し、本文収集の対象として登録する前に、本人の同意を取得・記録します。同意と撤回の受付は運営者が行い、現在アプリ内の本人向けセルフサービス同意フォームはありません。本人は窓口から同意を撤回できます。本人確認後、対象収集を停止し、関連する特別集計データを削除します。通常の管理用ログは別の記録のため、削除を希望する場合は依頼範囲に含めてください。サーバーの管理者権限は本人同意やDiscordの必要なIntent承認の代わりにはなりません。'))}
  ${section(en?'5. Access, disclosure and service providers':'5. 閲覧・共有・委託',p(en?'Analytics and exports are restricted to the relevant server’s owner/Administrator accounts. The operator and infrastructure providers may process data as needed for operation, maintenance and security. Authorized administrators are responsible for protecting downloaded CSV copies. We do not publicly publish analytics or provide data to advertisers or data brokers. Disclosure may be necessary to comply with law or protect rights and safety. GitHub Pages hosts this policy site only; no analytics data is published here. GitHub may process connection information under its own privacy statement.':'分析とCSV出力は、対象サーバーのオーナー／Administrator権限のあるアカウントに限定します。運用・保守・安全確保に必要な範囲で、運営者とホスティング等の基盤提供者が情報を扱う場合があります。管理者が取得したCSVの保護は取得者にも求めます。分析データの一般公開や、広告事業者・データ販売業者への提供は行いません。法令に基づく場合や権利・安全の保護に必要な場合に開示することがあります。GitHub Pagesはこのポリシーサイトのみを配信し、分析データを掲載しません。GitHubは自社のプライバシーステートメントに従い接続情報等を扱う場合があります。')+p('<a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub General Privacy Statement</a>'))}
  ${section(en?'6. Retention and deletion':'6. 保存期間と削除',list(en?[
   'The retention baseline for dated activity, message text and reaction/reply snapshots is 400 days. Maintenance jobs remove expired records in batches; deletion may not occur at the exact expiry time.',
   'Processed ingestion records have a seven-day cleanup baseline. Current identity/configuration records may remain while needed to operate the service or handle a request.',
   'Managed database backups use a 14-day rotation baseline by default. Copies in backups are restricted, expire through rotation, and must not be reintroduced into active use after an accepted deletion request.',
   'Removing a special-analysis target deletes its associated special-analysis records. Removing the bot or leaving a server does not by itself immediately erase every historical record. Request deletion through the operator.',
   'If legal obligations or an ongoing security incident require limited retention, the operator will explain the applicable scope and reason where permitted.'
  ]:[
   '日付付きの活動履歴、投稿本文、反応・返信スナップショット等は400日を保持期間の基準とし、期限後は保守処理で順次削除します。期限到来と同時の即時削除を保証するものではありません。',
   '処理済みの取り込み記録は7日を削除基準とします。運用に必要な最新の識別情報・設定等は、運用や依頼対応に必要な期間保持する場合があります。',
   '管理DBのバックアップは、既定14日の世代管理を基準とします。バックアップ内の複製は利用を制限し、世代更新で消去します。削除依頼の対象を復元後に再利用しないよう対応します。',
   '特別集計の対象削除では、関連する特別集計の記録を削除します。Botの削除やサーバー退出だけで、全履歴が即時削除されるわけではありません。全体の削除は運営者に依頼してください。',
   '法令上の義務や進行中のセキュリティ対応に必要な限定的保持がある場合は、可能な範囲で対象・理由を説明します。'
  ]))}
  ${section(en?'7. Your requests':'7. 本人からの依頼',p(en?`Contact ${contact} to ask about your data, withdraw special-analysis consent or request correction/deletion. Include only the Discord user ID, relevant server ID, request scope and a way to reply. The operator will verify identity and authority using proportionate information, investigate and respond without unnecessary delay. Requests are currently handled manually, not through an automated deletion portal. We never ask for your password, bot token, OAuth token or two-factor backup codes.`:`${contact}で、データの確認、特別集計の同意撤回、訂正・削除依頼を受け付けます。DiscordユーザーID、対象サーバーID、依頼範囲、返信先を必要な範囲でお知らせください。運営者は、過剰でない情報で本人・権限を確認し、調査のうえ不必要に遅延させず対応します。現在は自動削除ポータルではなく個別の手動対応です。パスワード、Botトークン、OAuthトークン、二要素認証のバックアップコードは求めません。`))}
  ${section(en?'8. Security and cookies':'8. 安全管理とCookie',p(en?'The analytics application uses access controls, restricted sessions and protected configuration. Authorized users must keep their devices and exports secure. Session cookies support login; this static policy site adds no advertising or analytics scripts or application login cookies. No security measure eliminates every risk.':'分析アプリではアクセス制御、権限制限付きセッション、設定情報の保護等を行います。利用者にも端末やCSVの安全管理を求めます。ログイン維持にはセッションCookieを使用します。この静的ポリシーサイトには広告・解析スクリプトやアプリのログインCookieを追加しません。すべてのリスクの排除を保証するものではありません。'))}
  ${section(en?'9. Updates':'9. 変更',p(en?'We publish material changes on this site with an updated date and, when appropriate, provide an additional notice. New collection purposes will require review and any necessary notice or consent.':'重要な変更は本サイトに更新日とともに掲載し、必要に応じて別途案内します。新しい収集目的を追加する場合は、その目的に応じた確認・説明・同意等を行います。'))}`;
 if(page==='terms')return `
  <h1>${text[lang].terms}</h1>
  ${section(en?'1. Service and eligibility':'1. サービスと利用条件',p(en?`${service}, operated by ${operator}, is a restricted server-administration analytics service. Use is limited to authorized server owners/Administrator accounts. Users must meet Discord’s age and eligibility requirements and comply with Discord’s applicable terms and policies. These terms do not grant access to any data or privileged intent that Discord does not authorize.`:`${operator}が運営する${service}は、サーバー管理用の閲覧制限付き分析サービスです。権限のあるサーバーオーナー／Administratorアカウントに利用を限定します。利用者はDiscordの年齢等の利用条件と適用される規約・ポリシーを守る必要があります。本規約は、Discordが許可していないデータ取得や特権Intentの利用を認めるものではありません。`))}
  ${section(en?'2. Administrator responsibilities':'2. 管理者の責任',list(en?[
   'Explain the bot’s collection and purposes to server members and use only necessary settings and permissions.',
   'Obtain and record the target’s informed consent before enabling special-analysis message-text collection; accept withdrawal and deletion requests.',
   'Use logs and statistics only for the stated server-administration, abuse investigation and consent-based measurement purposes.',
   'Protect administrator accounts, restrict access to exports, and do not publicly disclose personal logs or CSV data.'
  ]:[
   'サーバーメンバーへ収集内容・目的を案内し、必要な設定と権限だけを利用すること。',
   '特別集計で本文収集を有効にする前に、対象者の同意を取得・記録し、撤回・削除依頼を受け付けること。',
   'ログと集計を、明示したサーバー運営・荒らし等の調査・本人同意のある効果測定に限って利用すること。',
   '管理者アカウントと出力CSVを保護し、個人別ログやCSVを一般公開しないこと。'
  ]))}
  ${section(en?'3. Prohibited use':'3. 禁止事項',list(en?[
   'Unauthorized access, permission bypasses, token sharing or attempts to obtain data from another server.',
   'Harassment, stalking, doxxing, discrimination or inference of sensitive personal traits.',
   'Selling Discord-derived data, advertising use, AI model training, or use prohibited by Discord.',
   'Collecting message text for a target without the required consent or continuing targeted collection after an accepted withdrawal.',
   'Bypassing Discord API rate limits, intent approvals or other technical restrictions.'
  ]:[
   '不正アクセス、権限制御の回避、トークン共有、他サーバーの情報の不正取得。',
   '嫌がらせ、つきまとい、晒し、差別、センシティブな個人属性の推測。',
   'Discord由来データの販売、広告利用、AIモデル学習、Discordが禁止する利用。',
   '必要な同意のない対象者の本文収集、または受け付けた同意撤回後の対象収集の継続。',
   'Discord APIのレート制限、Intentの承認その他の技術的制限の回避。'
  ]))}
  ${section(en?'4. Accuracy and availability':'4. データの性質と稼働',p(en?'Data reflects observations, not a complete reconstruction of Discord history. Bot downtime, permissions, API limitations and unavailable past observations can cause missing or estimated values. Analytics is delayed by ten minutes. Invite attribution is an estimate, and response metrics do not prove a person’s intentions. Do not make serious disciplinary decisions based only on a ranking or automated metric; examine the underlying context. Features may change or be suspended for security, maintenance or Discord policy compliance.':'データは観測した範囲の記録であり、Discordの全履歴の完全な復元ではありません。Bot停止、権限、API制約、過去の未観測等により欠測・推定が生じます。分析には10分の遅延があります。招待経路は推定であり、反応の数値は本人の意図を証明しません。ランキングや機械的な指標だけで重大な処分を決めず、事実と文脈を確認してください。安全管理、保守、Discordの規約への対応等のため機能変更・停止を行う場合があります。'))}
  ${section(en?'5. Data and requests':'5. データと依頼',p(en?'Data handling is described in the Privacy Policy. Copyright and other rights in messages remain with their respective rights holders. These terms do not transfer ownership of user content. Contact the operator for consent withdrawal, data deletion or termination; uninstalling the bot alone does not immediately purge all records.':'情報の取り扱いはプライバシーポリシーに定めます。投稿等の著作権その他の権利は各権利者に帰属し、本規約で運営者へ権利が移転するものではありません。同意撤回・データ削除・利用終了は運営者へ連絡してください。Botのアンインストールだけで全記録が即時削除されるわけではありません。'))}
  ${section(en?'6. Contact and changes':'6. 連絡先と変更',p(en?`Contact: ${contact}. We publish updated terms on this site. Any limitation of responsibility applies only to the extent permitted by applicable law; this service does not promise uninterrupted operation or perfect accuracy.`:`連絡先：${contact}。規約を変更する場合は本サイトに掲載します。責任の制限は適用法令で認められる範囲に限られ、本サービスは継続稼働やデータの完全な正確性を保証するものではありません。`))}`;
 return `<h1>${text[lang].contact}</h1>
  ${section(en?'Contact the operator':'受付窓口',p(`${en?'Operator':'運営者'}: ${operator}`)+p(contact))}
  ${section(en?'Privacy, consent and deletion requests':'プライバシー・同意撤回・削除依頼',p(en?'Use this channel for questions about collection, withdrawal of consent, correction/deletion, access problems or security concerns. Requests are handled by the operator, not an automated form in the application.':'収集内容の確認、同意撤回、訂正・削除依頼、アクセスの問題、安全上の懸念を受け付けます。アプリ内の自動フォームではなく、運営者による個別対応です。')+list(en?['Your request type and the relevant service/server.','Your Discord user ID and relevant server ID, where needed to locate the data.','The data or period concerned and a reply address. Do not post personal logs in public GitHub Issues.']:['依頼の種類と、対象のサービス・サーバー。','対象データを確認するために必要なDiscordユーザーID・サーバーID。','対象データ・期間、返信先。個人別ログ等を公開GitHub Issueへ投稿しないでください。']))}
  ${section(en?'Contact via X':'Xでの連絡方法',p(en?'Open the operator’s X profile above and use an available contact method. For a privacy or deletion request, first ask to arrange a private conversation. Do not include user IDs, server IDs or personal logs in public replies or posts. Use direct messages when available; an X account or login may be required.':'上記の運営者のXプロフィールから、利用できる連絡方法でお問い合わせください。プライバシー・削除依頼では、まず非公開での連絡を希望する旨だけをお伝えください。公開リプライや投稿にユーザーID・サーバーID・個人別ログを書かないでください。DMが利用できる場合はDMを使用してください。Xアカウントやログインが必要になる場合があります。'))}
  ${section(en?'Verification and handling':'本人確認と対応',p(en?'We may ask for proportionate proof of identity or server authority before disclosing or deleting data. Do not send passwords, bot tokens, OAuth tokens, two-factor codes or identity documents unless a separately agreed lawful verification process requires them. We will review the request without unnecessary delay, clarify its scope and explain any legal or security-based retention. If special-analysis consent is withdrawn, ask explicitly to stop future targeted collection as well as delete existing special-analysis data.':'情報の開示・削除の前に、過剰でない方法で本人またはサーバー権限の確認を行う場合があります。パスワード、Botトークン、OAuthトークン、二要素認証コードは送信しないでください。身分証等も別途適切な確認手続を合意していない限り送信しないでください。依頼は不必要に遅延させず確認し、範囲を調整し、法令・安全管理に基づく保持がある場合は説明します。特別集計の同意を撤回する場合は、既存データの削除に加え、今後の対象収集の停止も明記してください。'))}`;
}
const out=join(root,'dist');await rm(out,{recursive:true,force:true});await mkdir(join(out,'assets'),{recursive:true});
await writeFile(join(out,'assets/site.css'),await readFile(join(root,'site.css')));
const pages=['home','privacy','terms','contact'];
for(const lang of ['ja','en'])for(const page of pages){
 const relative=(lang==='en'?'en/':'')+(page==='home'?'':page+'/');
 const level=relative.split('/').filter(Boolean).length,up='../'.repeat(level);
 const localHome=up+(lang==='en'?'en/':'');
 const destination=join(out,relative);await mkdir(destination,{recursive:true});
 const translated=up+(lang==='ja'?'en/':'')+(page==='home'?'':page+'/');
 const canonical=c.baseUrl+relative;
 const meta=draft?'<meta name="robots" content="noindex,nofollow">':`<link rel="canonical" href="${escape(canonical)}">`;
 const nav=pages.map(k=>`<a ${k===page?'aria-current="page"':''} href="${localHome||'./'}${k==='home'?'':k+'/'}">${text[lang][k]}</a>`).join('');
 const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${text[lang][page]} | ${service}</title><meta name="description" content="${escape(text[lang].summary)}">${meta}<link rel="stylesheet" href="${up}assets/site.css"></head><body><a class="skip" href="#main">${lang==='ja'?'本文へ':'Skip to content'}</a>${draft?'<div class="draft">非公開確認用ドラフト / LOCAL REVIEW DRAFT — DO NOT PUBLISH</div>':''}<header><div class="brand">${service}<span>POLICIES</span></div><nav aria-label="${lang==='ja'?'メインメニュー':'Main navigation'}">${nav}</nav><a class="language" href="${translated||'./'}" lang="${lang==='ja'?'en':'ja'}">${text[lang].lang}</a></header><main id="main"><div class="date">${text[lang].updated}: <time datetime="${escape(c.effectiveDate)}">${escape(c.effectiveDate)}</time></div>${content(lang,page)}</main><footer><p>${service} · ${operator}</p><p>${text[lang].footer}</p></footer></body></html>`;
 await writeFile(join(destination,'index.html'),html);
}
await writeFile(join(out,'.nojekyll'),'');
await writeFile(join(out,'robots.txt'),draft?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nSitemap: ${c.baseUrl}sitemap.xml\n`);
await writeFile(join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','privacy/','terms/','contact/','en/','en/privacy/','en/terms/','en/contact/'].map(path=>`<url><loc>${escape(c.baseUrl+path)}</loc><lastmod>${escape(c.effectiveDate)}</lastmod></url>`).join('')}</urlset>`);
console.log(`${draft?'Draft':'Publishable'} policy site built: 8 pages, no external scripts or analytics.`);
