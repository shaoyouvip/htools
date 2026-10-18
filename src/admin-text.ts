import type { Locale } from "./i18n";
import { DEFAULT_SOURCE_URL } from "./admin-helpers";
import { ADMIN_RESOURCE_FIELD_EXAMPLES } from "./admin-field-examples";
import type {
  AdminCategoryScope,
  BackupCounts,
  BackupRestoreResponse,
  FactoryResetResponse,
  ToolImportResponse
} from "./types";

// The English category empty state reads "Select or create a tool category".
// The four scope labels are Tool / Article / Subscription / Push, so only
// "article" needs "an" — picking by first letter keeps it correct if a scope is
// ever added, and makes the generated text match the subscription form's own
// help line (contentText.categoryPlaceholder) exactly.
function withEnglishArticle(noun: string) {
  return `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;
}

// 订阅内容的删除弹窗要同时交代"几个订阅"和"几条内容":删分类会把该分类下的订阅源
// 一起删掉,只说内容条数等于隐瞒了真正不可恢复的那部分。数量为 0 的那段整段省掉,
// 所以永远不会出现"0 个订阅"。两个都是 0 时到不了弹窗(删除前的守卫会直接放行),
// 因此这里不需要处理空字符串。
function describeSubscriptionPayloadZh(sourceCount: number, itemCount: number) {
  const parts: string[] = [];
  if (sourceCount > 0) parts.push(`${sourceCount} 个订阅`);
  if (itemCount > 0) parts.push(`${itemCount} 条内容`);

  // 用"和 "连接:中文数字两侧留空格,和这个文件里既有的 `中的 ${count} 条内容` 写法一致
  return parts.join("和 ");
}

// 英文沿用备份提示里既有的单复数写法(`${count} ${count === 1 ? "tool" : "tools"}`),
// 名词用 subscriptions / subscription items,不另造词。
function describeSubscriptionPayloadEn(sourceCount: number, itemCount: number) {
  const parts: string[] = [];
  if (sourceCount > 0) {
    parts.push(`${sourceCount} ${sourceCount === 1 ? "subscription" : "subscriptions"}`);
  }
  if (itemCount > 0) {
    parts.push(
      `${itemCount} ${itemCount === 1 ? "subscription item" : "subscription items"}`
    );
  }

  return parts.join(" and ");
}

export function getAdminMaintenanceText(locale: Locale) {
  if (locale === "zh") {
    const siteText = {
      siteTitle: "基本信息",
      siteDescription: "\u4fee\u6539\u5168\u7ad9\u663e\u793a\u7684\u7f51\u7ad9\u540d\u79f0\u3001\u526f\u6807\u9898\u4e0e\u56fe\u6807\uff0c\u5305\u62ec\u524d\u53f0\u3001\u540e\u53f0\u548c\u767b\u5f55\u9875\u9762\uff1b\u4e0d\u586b\u5199\u5219\u4f7f\u7528\u9ed8\u8ba4\u7ad9\u70b9\u4fe1\u606f\u3002",
      siteNameLabel: "\u7f51\u7ad9\u540d\u79f0",
      siteSubtitleLabel: "\u7f51\u7ad9\u526f\u6807\u9898",
      siteIconLabel: "\u7f51\u7ad9\u56fe\u6807 URL",
      siteIconChoiceHelp:
        "\u5efa\u8bae\u4f7f\u7528 512\u00d7512 \u900f\u660e PNG\uff1b\u4e5f\u652f\u6301 WEBP\u3001JPG\u3001GIF\u3001ICO\uff0c\u6700\u5927 1MB\u3002",
      siteIconPlaceholder: "https://example.com/icon.png",
      siteIconUpload: "选择图片",
      siteIconUploaded: "\u5df2\u4f7f\u7528\u672c\u5730\u4e0a\u4f20\u56fe\u6807",
      siteIconUploadInvalid: "\u8bf7\u9009\u62e9\u652f\u6301\u7684\u56fe\u7247\u683c\u5f0f\u3002",
      siteIconUploadTooLarge: "\u56fe\u7247\u8bf7\u63a7\u5236\u5728 1MB \u4ee5\u5185\u3002",
      siteSave: "保存信息",
      siteUpdated: "\u7ad9\u70b9\u4fe1\u606f\u5df2\u66f4\u65b0\u3002",
      siteReset: "\u6062\u590d\u9ed8\u8ba4",
      siteResetDone: "\u7ad9\u70b9\u4fe1\u606f\u5df2\u6062\u590d\u9ed8\u8ba4\u3002",
      siteIconInvalid: "\u7f51\u7ad9\u56fe\u6807\u5fc5\u987b\u662f\u6709\u6548\u7684 http/https \u5730\u5740\uff0c\u6216\u652f\u6301\u7684\u56fe\u7247\u6587\u4ef6\u3002",
      aboutSettingsTitle: "\u5173\u4e8e\u9875\u9762",
      aboutSettingsDescription: "\u5206\u522b\u7f16\u5199\u4e2d\u82f1\u6587\u5173\u4e8e\u9875\u9762\uff0c\u524d\u53f0\u4f1a\u6309\u5f53\u524d\u8bed\u8a00\u663e\u793a\u3002",
      aboutSave: "保存关于",
      aboutReset: "\u6062\u590d\u9ed8\u8ba4",
      aboutResetDone: "\u5173\u4e8e\u9875\u5df2\u6062\u590d\u9ed8\u8ba4\u3002",
      aboutUpdated: "\u5173\u4e8e\u9875\u9762\u5df2\u66f4\u65b0\u3002",
      privacySettingsTitle: "\u9690\u79c1\u653f\u7b56",
      privacySettingsDescription: "\u5206\u522b\u7f16\u5199\u4e2d\u82f1\u6587\u9690\u79c1\u653f\u7b56\uff0c\u524d\u53f0\u4f1a\u6309\u5f53\u524d\u8bed\u8a00\u663e\u793a\u3002",
      privacySave: "\u4fdd\u5b58\u9690\u79c1",
      privacyResetDone: "\u9690\u79c1\u653f\u7b56\u5df2\u6062\u590d\u9ed8\u8ba4\u3002",
      privacyUpdated: "\u9690\u79c1\u653f\u7b56\u5df2\u66f4\u65b0\u3002",
      termsSettingsTitle: "\u670d\u52a1\u6761\u6b3e",
      termsSettingsDescription: "\u5206\u522b\u7f16\u5199\u4e2d\u82f1\u6587\u670d\u52a1\u6761\u6b3e\uff0c\u524d\u53f0\u4f1a\u6309\u5f53\u524d\u8bed\u8a00\u663e\u793a\u3002",
      termsSave: "\u4fdd\u5b58\u6761\u6b3e",
      termsResetDone: "\u670d\u52a1\u6761\u6b3e\u5df2\u6062\u590d\u9ed8\u8ba4\u3002",
      termsUpdated: "\u670d\u52a1\u6761\u6b3e\u5df2\u66f4\u65b0\u3002",
      legalChinese: "\u4e2d\u6587 Markdown",
      legalEnglish: "\u82f1\u6587 Markdown",
      footerTitle: "\u9875\u811a\u8bbe\u7f6e",
      footerDescription: "\u81ea\u5b9a\u4e49\u524d\u53f0\u5e95\u90e8\u7684\u4ecb\u7ecd\u3001\u8d5e\u52a9\u6309\u94ae\u548c\u94fe\u63a5\u680f\u76ee\u3002\u4e0d\u586b\u5199\u5219\u4f7f\u7528\u9ed8\u8ba4\u9875\u811a\u914d\u7f6e\u3002",
      footerIntroLabel: "\u9875\u811a\u4ecb\u7ecd",
      footerSponsorLabel: "\u8d5e\u52a9\u6309\u94ae\u6587\u5b57",
      footerSponsorUrl: "\u8d5e\u52a9\u6309\u94ae\u94fe\u63a5",
      footerSocialLinks: "\u793e\u4ea4\u56fe\u6807\u94fe\u63a5 JSON",
      footerGroups: "\u9875\u811a\u680f\u76ee JSON",
      footerJsonHelp: "\u793e\u4ea4\u94fe\u63a5\u4f7f\u7528 [{\"label\":\"GitHub\",\"href\":\"https://...\"}]\uff1b\u680f\u76ee\u4f7f\u7528 [{\"title\":\"\u4ea7\u54c1\",\"links\":[{\"label\":\"\u5de5\u5177\",\"href\":\"/tools\"}]}]\u3002",
      footerSave: "保存页脚",
      footerReset: "\u6062\u590d\u9ed8\u8ba4",
      footerResetDone: "\u9875\u811a\u8bbe\u7f6e\u5df2\u6062\u590d\u9ed8\u8ba4\u3002",
      footerUpdated: "\u9875\u811a\u8bbe\u7f6e\u5df2\u66f4\u65b0\u3002",
      footerJsonInvalid: "\u9875\u811a JSON \u683c\u5f0f\u4e0d\u6b63\u786e\u3002",
      footerSocialJsonInvalid: "\u793e\u4ea4\u94fe\u63a5 JSON \u5fc5\u987b\u5305\u542b label \u548c href \u5b57\u6bb5\u3002",
      footerGroupsJsonInvalid: "\u9875\u811a\u680f\u76ee JSON \u5fc5\u987b\u5305\u542b title \u548c links \u5b57\u6bb5\u3002",
      homeSettingsTitle: "\u9996\u9875\u6587\u6848",
      homeSettingsDescription:
        "\u5206\u522b\u8bbe\u7f6e\u4e2d\u6587\u548c\u82f1\u6587\u9996\u9875\u9996\u5c4f\u6587\u6848\uff0c\u7559\u7a7a\u65f6\u4f7f\u7528\u5bf9\u5e94\u8bed\u8a00\u7684\u9ed8\u8ba4\u6587\u6848\u3002",
      homeChinese: "\u4e2d\u6587\u6587\u6848",
      homeEnglish: "\u82f1\u6587\u6587\u6848",
      homeTitleTop: "\u6807\u9898\u7b2c\u4e00\u884c",
      homeTitleBottom: "\u6807\u9898\u7b2c\u4e8c\u884c",
      homeDescription: "\u9996\u9875\u7b80\u4ecb",
      homeSave: "\u4fdd\u5b58\u6587\u6848",
      homeReset: "\u6062\u590d\u9ed8\u8ba4",
      homeResetDone: "\u9996\u9875\u6587\u6848\u5df2\u6062\u590d\u9ed8\u8ba4\u3002",
      homeUpdated: "\u9996\u9875\u6587\u6848\u5df2\u66f4\u65b0\u3002",
    };

    return {
      ...siteText,
      importExportTab: "导入导出",
      linkCheckTab: "链接检测",
      sourceTitle: "导入",
      sourceDescription: "\u53ef\u586b\u5199\u8ba2\u9605\u6e90\u5730\u5740\uff0c\u4e5f\u53ef\u9009\u62e9\u672c\u5730 htools.json \u6587\u4ef6\u3002\u5bfc\u5165\u524d\u53ef\u5148\u68c0\u67e5\u6570\u636e\uff0c\u786e\u8ba4\u65b0\u589e\u3001\u66f4\u65b0\u548c\u8df3\u8fc7\u6570\u91cf\u3002",
      sourceUrl: "\u8ba2\u9605\u6e90 URL",
      sourceFileLabel: "\u8ba2\u9605\u6e90\u6587\u4ef6",
      sourceFileChoose: "\u9009\u62e9\u6587\u4ef6",
      sourceFileReplace: "\u66ff\u6362\u6587\u4ef6",
      sourceFileRemove: "\u79fb\u9664\u6587\u4ef6",
      sourceFileHelp: "\u652f\u6301\u517c\u5bb9\u7684 htools.json \u6587\u4ef6\uff0c\u6700\u5927 10MB\u3002",
      sourceFileSelected: (name: string) => `\u5f53\u524d\u6587\u4ef6\uff1a${name}`,
      sourceUrlOrigin: "\u8ba2\u9605\u6e90 URL",
      sourceFileOrigin: (name: string) => `\u8ba2\u9605\u6e90\u6587\u4ef6\u201c${name}\u201d`,
      sourceFileTooLarge: "\u8ba2\u9605\u6e90\u6587\u4ef6\u8bf7\u63a7\u5236\u5728 10MB \u4ee5\u5185\u3002",
      sourcePlaceholder: DEFAULT_SOURCE_URL,
      sourceDetect: "\u68c0\u6d4b\u8ba2\u9605",
      sourceImport: "\u5bfc\u5165\u8ba2\u9605",
      sourceExport: "\u5bfc\u51fa\u8ba2\u9605",
      sourceExportTitle: "导出",
      sourceExportDescription: "将当前工具库导出为兼容的 htools.json 订阅源文件。",
      sourceExportCount: "工具数量",
      sourceExportFormat: "文件格式",
      sourceExportScope: "数据范围",
      sourceExportScopeAll: "全部工具",
      sourceMode: "\u5bfc\u5165\u65b9\u5f0f",
      sourceModeSkip: "\u8df3\u8fc7\u91cd\u590d",
      sourceModeUpsert: "\u8986\u76d6\u66f4\u65b0",
      sourceModeHelp: "\u9ed8\u8ba4\u8df3\u8fc7\u5df2\u5b58\u5728 URL\uff1b\u9700\u8981\u540c\u6b65\u66f4\u65b0\u65f6\u518d\u9009\u62e9\u8986\u76d6\u3002",
      sourceEmpty: "\u8ba2\u9605\u6e90\u6ca1\u6709\u53ef\u8bfb\u53d6\u7684\u5de5\u5177\u6570\u636e\u3002",
      sourceInvalid: "JSON \u5fc5\u987b\u662f\u6570\u7ec4\uff0c\u6216\u5305\u542b tools \u6570\u7ec4\u7684\u5bf9\u8c61\u3002",
      sourceTotal: "\u603b\u6570",
      sourceValid: "\u6709\u6548",
      sourceDuplicate: "\u8ba2\u9605\u6e90\u5185\u91cd\u590d",
      sourceExisting: "\u672c\u7ad9\u91cd\u590d",
      sourceMissing: "\u7f3a\u5b57\u6bb5",
      sourceWillCreate: "\u5c06\u65b0\u589e",
      sourceWillUpdate: "\u5c06\u66f4\u65b0",
      sourceWillSkip: "\u5c06\u8df3\u8fc7",
      sourceErrors: "\u683c\u5f0f\u95ee\u9898",
      sourceItemObject: "\u8be5\u6761\u76ee\u5fc5\u987b\u662f\u5bf9\u8c61\u3002",
      sourceUrlInvalid: "url \u5fc5\u987b\u662f\u6709\u6548\u7f51\u5740\u3002",
      sourceDemoUrlInvalid: "demoUrl \u5fc5\u987b\u662f\u6709\u6548\u7f51\u5740\u3002",
      sourceImageInvalid: "image \u5fc5\u987b\u662f\u6709\u6548\u7f51\u5740\u3002",
      sourceOperationFailed: "\u8ba2\u9605\u6e90\u64cd\u4f5c\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u5730\u5740\u6216\u7a0d\u540e\u91cd\u8bd5\u3002",
      systemTitle: "\u7cfb\u7edf\u8bbe\u7f6e",
      systemGroupGeneral: "站点信息",
      systemGroupIntegrations: "服务设置",
      systemGroupSecurity: "管理设置",
      unsavedTitle: "\u672a\u4fdd\u5b58\u8bbe\u7f6e",
      unsavedDescription:
        "当前有未保存的设置。恢复备份会替换这些输入，是否放弃更改并继续？",
      unsavedStay: "\u7ee7\u7eed\u7f16\u8f91",
      unsavedLeave: "\u653e\u5f03\u66f4\u6539",
      systemRetry: "重新加载",
      aiTitle: "Cloudflare Workers AI",
      aiDescription: "\u63d0\u4f9b\u540d\u79f0\u3001\u7b80\u4ecb\u3001\u6458\u8981\u4e0e\u6807\u7b7e\u751f\u6210\uff0c\u5e76\u652f\u6301\u5c06\u5e38\u89c1\u6587\u6863\u8f6c\u6362\u4e3a\u6587\u7ae0 Markdown\u3002",
      aiEnabled: "\u5df2\u5f00\u542f",
      aiDisabled: "\u5df2\u5173\u95ed",
      aiEnableHint: "\u8bf7\u5148\u5728\u7cfb\u7edf\u8bbe\u7f6e\u4e2d\u5f00\u542f Workers AI",
      aiModelLabel: "\u751f\u6210\u6a21\u578b",
      aiBindingLabel: "Cloudflare Workers AI \u7ed1\u5b9a",
      aiModelDefault: "Qwen3 30B",
      aiModelLlama: "Llama 3.3 70B",
      aiSave: "\u4fdd\u5b58\u8bbe\u7f6e",
      aiUpdated: "Workers AI \u8bbe\u7f6e\u5df2\u4fdd\u5b58\u3002",
      aiEnabledMessage: "Workers AI \u5df2\u5f00\u542f\u3002",
      aiDisabledMessage: "Workers AI \u5df2\u5173\u95ed\u3002",
      aiGenerateName: "\u751f\u6210\u540d\u79f0",
      aiGenerateTitle: "\u751f\u6210\u6807\u9898",
      aiGeneratePushTitle: "\u751f\u6210\u6807\u9898",
      aiGenerateDescription: "\u751f\u6210\u7b80\u4ecb",
      aiGenerateSummary: "\u751f\u6210\u6458\u8981",
      aiGenerateTags: "\u751f\u6210\u6807\u7b7e",
      aiApplied: "\u5df2\u6309\u5f53\u524d\u5185\u5bb9\u751f\u6210\uff0c\u4fdd\u5b58\u540e\u751f\u6548\u3002",
      aiAppliedWithGitHub: (repository: string) =>
        `\u5df2\u6309\u4ed3\u5e93 ${repository} \u751f\u6210\uff0c\u4fdd\u5b58\u540e\u751f\u6548\u3002`,
      aiImportDocument: "\u5bfc\u5165\u6587\u6863",
      aiImportingDocument: "\u8f6c\u6362\u4e2d",
      aiDocumentApplied: "\u6587\u6863\u5185\u5bb9\u5df2\u8f6c\u6362\u4e3a Markdown \u5e76\u586b\u5165\u5f53\u524d\u6b63\u6587\uff0c\u4fdd\u5b58\u540e\u624d\u4f1a\u5199\u5165\u6570\u636e\u5e93\u3002",
      aiDocumentReplaceTitle: "\u8986\u76d6\u5f53\u524d\u6b63\u6587",
      aiDocumentReplaceDescription: "\u8f6c\u6362\u540e\u7684 Markdown \u5c06\u66ff\u6362\u5f53\u524d\u6587\u7ae0\u6b63\u6587\uff0c\u6807\u9898\u3001\u6458\u8981\u548c\u5176\u4ed6\u5b57\u6bb5\u4e0d\u4f1a\u6539\u53d8\u3002",
      githubSubmissionTitle: "GitHub \u63d0\u4ea4\u8bbe\u7f6e",
      githubSubmissionDescription: "\u914d\u7f6e\u63a5\u6536\u516c\u5f00\u5de5\u5177\u5efa\u8bae\u7684 GitHub \u4ed3\u5e93\uff0c\u7528\u6237\u5c06\u524d\u5f80 GitHub \u786e\u8ba4\u5e76\u521b\u5efa Issue\u3002",
      securityTitle: "\u7ba1\u7406\u5458\u5b89\u5168\u8bbe\u7f6e",
      securityDescription: "\u7edf\u4e00\u7ba1\u7406\u540e\u53f0\u767b\u5f55\u5bc6\u7801\uff0c\u5efa\u8bae\u5b9a\u671f\u66f4\u65b0\u5e76\u907f\u514d\u4f7f\u7528\u5f31\u5bc6\u7801\u3002",
      securityCurrent: "\u5f53\u524d\u5bc6\u7801",
      securityNew: "\u65b0\u5bc6\u7801",
      securityConfirm: "\u786e\u8ba4\u65b0\u5bc6\u7801",
      securitySave: "\u66f4\u65b0\u5bc6\u7801",
      securityCurrentRequired: "\u8bf7\u8f93\u5165\u5f53\u524d\u5bc6\u7801\u3002",
      securityNewRequired: "\u8bf7\u8f93\u5165\u65b0\u5bc6\u7801\u3002",
      securityConfirmRequired: "\u8bf7\u786e\u8ba4\u65b0\u5bc6\u7801\u3002",
      securityMismatch: "\u4e24\u6b21\u8f93\u5165\u7684\u65b0\u5bc6\u7801\u4e0d\u4e00\u81f4\u3002",
      securityCurrentIncorrect: "\u5f53\u524d\u5bc6\u7801\u4e0d\u6b63\u786e\u3002",
      securityUnchanged: "\u65b0\u5bc6\u7801\u4e0d\u80fd\u4e0e\u5f53\u524d\u5bc6\u7801\u76f8\u540c\u3002",
      securityUpdated: "\u7ba1\u7406\u5458\u5bc6\u7801\u5df2\u66f4\u65b0\u3002",
      backupTitle: "\u5907\u4efd\u4e0e\u6062\u590d",
      backupDescription: "备份站点内容与设置，不含密码、密钥及登录会话。",
      backupHelp:
        "恢复会覆盖当前数据，请先导出备份。",
      backupExport: "\u5bfc\u51fa\u5907\u4efd",
      backupChoose: "选择文件",
      backupRestore: "\u6062\u590d\u5907\u4efd",
      backupEmpty: "\u8bf7\u5148\u9009\u62e9\u5907\u4efd JSON \u6587\u4ef6\u3002",
      backupInvalid: "请选择 HTools 完整备份 JSON 文件。",
      backupTooLarge: "备份文件请控制在 10MB 以内。",
      backupRestoreConfirm: (counts: BackupCounts) =>
        `确定恢复此备份吗？将用 ${counts.tools} 个工具、${counts.articles} 篇文章、${counts.contentSources} 个订阅、${counts.contentItems} 条订阅内容、${counts.telegramMessages} 条推送记录和 ${counts.settings} 项设置覆盖当前站点。`,
      publicTitle: "我的订阅源",
      publicDescription: "默认关闭。开启后，其他人可以通过下方地址订阅当前工具列表。",
      publicEnabled: "\u5df2\u5f00\u542f",
      publicDisabled: "\u5df2\u5173\u95ed",
      publicSourceUrlLabel: "当前订阅源地址",
      githubSubmissionEnabledMessage: "GitHub 提交已开启。",
      githubSubmissionDisabledMessage: "GitHub 提交已关闭。",
      publicEnabledMessage: "我的订阅源已开启。",
      publicDisabledMessage: "我的订阅源已关闭。",
      proxyEnabledMessage: "代理访问已开启。",
      proxyDisabledMessage: "代理访问已关闭。",
      serviceUnavailable: "未配置",
      rssHubTitle: "RSSHub",
      rssHubDescription: "将 Folo 等应用中的 rsshub:// 订阅地址转换为可同步的 RSS 地址；默认已开启，也可更换 RSSHub 服务地址。",
      rssHubUrlLabel: "RSSHub 服务地址",
      rssHubUrlPlaceholder: "https://rsshub.rssforever.com/",
      rssHubEnabled: "已开启",
      rssHubDisabled: "已关闭",
      rssHubEnabledMessage: "RSSHub 已开启。",
      rssHubDisabledMessage: "RSSHub 已关闭。",
      rssHubSave: "保存设置",
      rssHubUpdated: "RSSHub 设置已保存。",
      turnstileTitle: "Cloudflare Turnstile",
      turnstileDescription: "用于保护管理员登录并减少恶意尝试；请在项目配置下方两个环境变量，即可开启或关闭，密钥不会在后台显示。",
      turnstileSiteKeyLabel: "Cloudflare 站点密钥（Site Key）",
      turnstileSecretKeyLabel: "Cloudflare 密钥（Secret Key）",
      turnstileEnabled: "已开启",
      turnstileDisabled: "已关闭",
      turnstileEnabledMessage: "Cloudflare Turnstile 已开启。",
      turnstileDisabledMessage: "Cloudflare Turnstile 已关闭。",
      imageBedTitle: "CloudFlare ImgBed",
      imageBedDescription: "为工具、文章和消息推送上传图片，支持 PNG、JPEG、WebP、GIF 和 AVIF，单张不超过 10MB。API Token 由部署环境提供，图床地址和上传方式可在这里设置。",
      imageBedTokenLabel: "仅含 upload 权限的 API Token",
      imageBedUrlLabel: "图床服务地址",
      imageBedUrlPlaceholder: "https://img.example.com/",
      imageBedChannelLabel: "上传渠道",
      imageBedChannelTelegram: "Telegram",
      imageBedChannelR2: "Cloudflare R2",
      imageBedChannelS3: "S3",
      imageBedChannelDiscord: "Discord",
      imageBedChannelHuggingFace: "HuggingFace",
      imageBedChannelWebDav: "WebDAV",
      imageBedChannelNameLabel: "渠道名称",
      imageBedChannelNamePlaceholder: "可选，多渠道时填写",
      imageBedNameTypeLabel: "文件命名方式",
      imageBedNameTypeDefault: "前缀 + 原文件名",
      imageBedNameTypeIndex: "仅使用前缀",
      imageBedNameTypeOrigin: "仅使用原文件名",
      imageBedNameTypeShort: "短链接",
      imageBedFolderLabel: "上传目录",
      imageBedFolderPlaceholder: "可选：htools/images",
      imageBedEnabled: "已开启",
      imageBedDisabled: "已关闭",
      imageBedSave: "保存设置",
      imageBedUpdated: "图床设置已保存。",
      imageBedEnabledMessage: "图片上传已开启。",
      imageBedDisabledMessage: "图片上传已关闭。",
      telegramTitle: "Telegram 推送",
      telegramDescription: "将工具、文章或自定义消息手动推送到指定的 Telegram 账户、群组或频道。机器人 Token 由部署环境提供，接收目标可在这里设置。",
      telegramTokenLabel: "发送通知的机器人 Token",
      telegramTargetLabel: "接收通知的账户、群组或频道 ID",
      telegramTargetPlaceholder: "-1001234567890 或 @channelname",
      telegramEnabled: "已开启",
      telegramDisabled: "已关闭",
      telegramSave: "保存设置",
      telegramTest: "测试连接",
      telegramFooterLabel: "固定消息尾巴 Markdown",
      telegramFooterPlaceholder: "[频道](https://t.me/example) ｜ [聊天](https://t.me/example_group)",
      telegramUpdated: "Telegram 推送设置已保存。",
      telegramEnabledMessage: "Telegram 推送已开启。",
      telegramDisabledMessage: "Telegram 推送已关闭。",
      telegramSaveBeforeEnable: "请先保存当前设置，再开启 Telegram 推送。",
      telegramConnected: (title: string, bot: string, unsaved: boolean) =>
        `连接正常：${title}${bot ? `，机器人 @${bot}` : ""}。${unsaved ? "当前目标尚未保存。" : ""}`,
      umamiTitle: "Umami 访问统计",
      umamiDescription: "连接自托管 Umami 或 Umami Cloud，统计站点访问情况；保存完整配置后可在这里开启或关闭。",
      umamiScriptUrlLabel: "统计脚本地址",
      umamiScriptUrlPlaceholder: "https://example.com/script.js",
      umamiWebsiteIdLabel: "Website ID",
      umamiWebsiteIdPlaceholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      umamiEnabled: "已开启",
      umamiDisabled: "已关闭",
      umamiSave: "保存设置",
      umamiUpdated: "Umami 设置已保存。",
      umamiEnabledMessage: "Umami 访问统计已开启。",
      umamiDisabledMessage: "Umami 访问统计已关闭。",
      umamiRequired: "请先填写并保存统计脚本地址和 Website ID。",
      umamiInvalidUrl: "请输入有效的 Umami 统计脚本地址。",
      proxyTitle: "代理访问",
      proxyDescription: "为无法直连的外部图片或链接提供代理转发，仅代理下方所选范围；站内页面、API 与站点图标仍保持直连。\n\n提示：请谨慎开启。部分站点、图片防盗链或登录跳转可能与代理不兼容，如果开启后页面显示异常，请先关闭代理或更换代理服务。",
      proxyHelp: "全站代理会代理外部链接和外部图片；仅代理图片只代理工具预览图、文章图片、订阅内容封面等图片资源，普通外部链接保持直连。直接拼接使用“代理地址 + 目标地址”；Edgeone-Proxy 标准使用 `/proxy?url=`；Edgeone-Proxy 高级使用 `/advanced-proxy?url=`。\n\nHTools 不内置代理服务，如需使用，可自行部署代理项目后填写部署地址。",
      proxyEnabled: "\u5df2\u5f00\u542f",
      proxyDisabled: "\u5df2\u5173\u95ed",
      proxyUrlLabel: "\u4ee3\u7406\u670d\u52a1\u5730\u5740",
      proxyPlaceholder: "https://your-proxy.example.com/",
      proxyScopeLabel: "代理范围",
      proxyScopeAll: "全站代理",
      proxyScopeImages: "仅代理图片",
      proxyModeLabel: "\u4ee3\u7406\u8bbf\u95ee\u89c4\u5219",
      proxyModePrefix: "\u76f4\u63a5\u62fc\u63a5",
      proxyModeEdgeOneProxy: "Edgeone-Proxy \u6807\u51c6",
      proxyModeEdgeOneAdvanced: "Edgeone-Proxy \u9ad8\u7ea7",
      proxyProjectLink: "Edgeone-Proxy \u9879\u76ee",
      proxySave: "保存设置",
      proxyRequired: "\u5f00\u542f\u4ee3\u7406\u524d\u8bf7\u586b\u5199\u4ee3\u7406\u670d\u52a1\u5730\u5740\u3002",
      proxyInvalid: "\u4ee3\u7406\u670d\u52a1\u5730\u5740\u5fc5\u987b\u662f\u6709\u6548\u7684 http/https \u5730\u5740\u3002",
      proxyUpdated: "\u4ee3\u7406\u8bbe\u7f6e\u5df2\u66f4\u65b0\u3002",
      resetTitle: "\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e",
      resetDescription:
        "清空工具、文章、订阅、分类和推送记录，关闭本站订阅源。",
      resetWarning:
        "保留系统设置、密码及 Telegram 已发消息。操作前请先备份。",
      resetButton: "恢复默认",
      resetConfirm:
        "\u786e\u5b9a\u8981\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e\u5417\uff1f\u8fd9\u5c06\u5220\u9664\u5de5\u5177\u3001\u6587\u7ae0\u3001\u8ba2\u9605\u5185\u5bb9\u548c\u9884\u5efa\u5206\u7c7b\uff0c\u5e76\u5173\u95ed\u7ad9\u70b9\u6e90\u3002",
      linkModuleTitle: "\u672c\u7ad9\u94fe\u63a5\u68c0\u6d4b",
      linkModuleDescription: "\u68c0\u6d4b\u5df2\u4fdd\u5b58\u5de5\u5177\u7684\u9879\u76ee\u5730\u5740\u548c\u6f14\u793a\u7ad9\u70b9\u662f\u5426\u53ef\u8bbf\u95ee\uff0c\u7ed3\u679c\u53ea\u5c55\u793a\uff0c\u4e0d\u4f1a\u4fee\u6539\u94fe\u63a5\u3002",
      urlLabel: "\u9879\u76ee\u5730\u5740",
      demoUrlLabel: "\u6f14\u793a\u7ad9\u70b9",
      sourceChecked: (origin: string, count: number) =>
        `${origin}\u68c0\u6d4b\u5b8c\u6210\uff1a\u5171 ${count} \u6761\u3002`,
      sourceFileChecked: (name: string, count: number) =>
        `\u6587\u4ef6\u201c${name}\u201d\u8bfb\u53d6\u5b8c\u6210\uff1a\u5171 ${count} \u6761\u3002`,
      sourceImportSummary: (origin: string, result: ToolImportResponse) =>
        `${origin}\u5bfc\u5165\u5b8c\u6210\uff1a\u65b0\u589e ${result.imported}\uff0c\u66f4\u65b0 ${result.updated}\uff0c\u8df3\u8fc7 ${result.skipped}\uff0c\u5931\u8d25 ${result.failed}\u3002`,
      sourceExported: (count: number) => `导出完成：共 ${count} 个工具，文件已下载。`,
      sourceErrorItem: (index: number, message: string) =>
        `\u7b2c ${index + 1} \u6761\uff1a${message}`,
      sourceRequestFailed: (status: number) => `\u8ba2\u9605\u6e90\u8bf7\u6c42\u5931\u8d25\uff1a${status}`,
      sourceRequired: (fields: string) => `${fields} \u4e3a\u5fc5\u586b\u5b57\u6bb5\u3002`,
      securityUpdatedAt: (date: string) => `\u4e0a\u6b21\u66f4\u65b0\uff1a${date}`,
      backupExported: (counts: BackupCounts) =>
        `已导出完整备份：工具 ${counts.tools}，文章 ${counts.articles}，订阅 ${counts.contentSources}，订阅内容 ${counts.contentItems}，推送记录 ${counts.telegramMessages}，设置 ${counts.settings}。`,
      backupReady: (name: string, counts: BackupCounts) =>
        `已读取 ${name}：工具 ${counts.tools}，文章 ${counts.articles}，订阅 ${counts.contentSources}，订阅内容 ${counts.contentItems}，推送记录 ${counts.telegramMessages}，设置 ${counts.settings}。`,
      backupRestoreSummary: (result: BackupRestoreResponse) =>
        `恢复完成：工具 ${result.counts.tools}，文章 ${result.counts.articles}，订阅 ${result.counts.contentSources}，订阅内容 ${result.counts.contentItems}，推送记录 ${result.counts.telegramMessages}，设置 ${result.counts.settings}。`,
      resetDone: (result: FactoryResetResponse) =>
        `已恢复默认设置：删除工具 ${result.counts.tools}，文章 ${result.counts.articles}，订阅 ${result.counts.contentSources}，订阅内容 ${result.counts.contentItems}，推送记录 ${result.counts.telegramMessages}。`
    };
  }

  return {
    importExportTab: "Import / Export",
    linkCheckTab: "Link Check",
    sourceTitle: "Import",
    sourceDescription:
      "Enter a subscription source URL or choose a local htools.json file. Check the data before importing to review how many tools will be created, updated, or skipped.",
    sourceUrl: "Subscription source URL",
    sourceFileLabel: "Subscription source file",
    sourceFileChoose: "Choose File",
    sourceFileReplace: "Replace File",
    sourceFileRemove: "Remove File",
    sourceFileHelp: "Supports compatible htools.json files up to 10MB.",
    sourceFileSelected: (name: string) => `Current file: ${name}`,
    sourceUrlOrigin: "Subscription source URL",
    sourceFileOrigin: (name: string) => `Subscription source file "${name}"`,
    sourceFileTooLarge: "Keep the subscription source file under 10MB.",
    sourcePlaceholder: DEFAULT_SOURCE_URL,
    sourceDetect: "Check Subscription",
    sourceImport: "Import Subscription",
    sourceExport: "Export Subscription",
    sourceExportTitle: "Export",
    sourceExportDescription:
      "Export the current tool library as a compatible htools.json subscription source file.",
    sourceExportCount: "Tool count",
    sourceExportFormat: "File format",
    sourceExportScope: "Data scope",
    sourceExportScopeAll: "All tools",
    sourceMode: "Import mode",
    sourceModeSkip: "Skip duplicates",
    sourceModeUpsert: "Overwrite same URL",
    sourceModeHelp:
      "Duplicate URLs are skipped by default; choose overwrite when you want to sync updates.",
    sourceEmpty: "The source did not include readable tool data.",
    sourceInvalid: "JSON must be an array or an object with a tools array.",
    sourceChecked: (origin: string, count: number) =>
      `${origin} check complete: ${count} items.`,
    sourceFileChecked: (name: string, count: number) =>
      `File "${name}" loaded: ${count} items.`,
    sourceImportSummary: (origin: string, result: ToolImportResponse) =>
      `${origin} import complete: ${result.imported} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed.`,
    sourceExported: (count: number) =>
      `Export complete: ${count} ${count === 1 ? "tool" : "tools"}; the file has been downloaded.`,
    sourceTotal: "Total",
    sourceValid: "Valid",
    sourceDuplicate: "Subscription dupes",
    sourceExisting: "Existing",
    sourceMissing: "Missing",
    sourceWillCreate: "Will create",
    sourceWillUpdate: "Will update",
    sourceWillSkip: "Will skip",
    sourceErrors: "Format issues",
    sourceErrorItem: (index: number, message: string) =>
      `Item ${index + 1}: ${message}`,
    sourceRequestFailed: (status: number) => `Source request failed: ${status}`,
    sourceItemObject: "Item must be an object.",
    sourceRequired: (fields: string) => `${fields} is required.`,
    sourceUrlInvalid: "url must be a valid URL.",
    sourceDemoUrlInvalid: "demoUrl must be a valid URL.",
    sourceImageInvalid: "image must be a valid URL.",
    sourceOperationFailed:
      "Subscription source operation failed. Check the URL or try again later.",
    systemTitle: "System Settings",
    systemGroupGeneral: "Site Information",
    systemGroupIntegrations: "Service Settings",
    systemGroupSecurity: "Management Settings",
    unsavedTitle: "Unsaved Settings",
    unsavedDescription:
      "You have unsaved settings. Restoring a backup will replace these inputs. Discard changes and continue?",
    unsavedStay: "Keep Editing",
    unsavedLeave: "Discard Changes",
    systemRetry: "Reload",
    aiTitle: "Cloudflare Workers AI",
    aiDescription: "Generates names, descriptions, summaries, and tags, and converts common documents into article Markdown.",
    aiEnabled: "Enabled",
    aiDisabled: "Disabled",
    aiEnableHint: "Enable Workers AI in system settings first",
    aiModelLabel: "Generation model",
    aiBindingLabel: "Cloudflare Workers AI binding",
    aiModelDefault: "Qwen3 30B",
    aiModelLlama: "Llama 3.3 70B",
    aiSave: "Save Settings",
    aiUpdated: "Workers AI settings saved.",
    aiEnabledMessage: "Workers AI enabled.",
    aiDisabledMessage: "Workers AI disabled.",
    aiGenerateName: "Generate Name",
    aiGenerateTitle: "Generate Title",
    aiGeneratePushTitle: "Generate Title",
    aiGenerateDescription: "Generate Description",
    aiGenerateSummary: "Generate Summary",
    aiGenerateTags: "Generate Tags",
    aiApplied: "Generated from the current content. Save to apply.",
    aiAppliedWithGitHub: (repository: string) =>
      `Generated from repository ${repository}. Save to apply.`,
    aiImportDocument: "Import Document",
    aiImportingDocument: "Converting",
    aiDocumentApplied: "The document was converted to Markdown and applied to the current body. Save to persist it.",
    aiDocumentReplaceTitle: "Replace Current Body",
    aiDocumentReplaceDescription: "The converted Markdown will replace the current article body. The title, summary, and other fields will not change.",
    siteTitle: "Basic Information",
    siteDescription:
      "Change the site name, subtitle, and icon used across the frontend, admin area, and login page. Leave blank to use the default site identity.",
    siteNameLabel: "Site name",
    siteSubtitleLabel: "Site subtitle",
    siteIconLabel: "Site icon URL",
    siteIconChoiceHelp:
      "Use a 512\u00d7512 transparent PNG. WEBP, JPG, GIF, and ICO up to 1MB are also supported.",
    siteIconPlaceholder: "https://example.com/icon.png",
    siteIconUpload: "Choose Image",
    siteIconUploaded: "Using uploaded local icon",
    siteIconUploadInvalid: "Choose a supported image format.",
    siteIconUploadTooLarge: "Keep the image under 1MB.",
    siteSave: "Save Info",
    siteUpdated: "Site identity updated.",
    siteReset: "Restore Defaults",
    siteResetDone: "Site identity restored to defaults.",
    siteIconInvalid:
      "Site icon must be a valid http/https URL or a supported image file.",
    aboutSettingsTitle: "About Page",
    aboutSettingsDescription:
      "Edit the Chinese and English About pages shown for each frontend language.",
    aboutSave: "Save About",
    aboutReset: "Restore Defaults",
    aboutResetDone: "About page restored to defaults.",
    aboutUpdated: "About page updated.",
    privacySettingsTitle: "Privacy Policy",
    privacySettingsDescription:
      "Edit the Chinese and English privacy policies shown for each frontend language.",
    privacySave: "Save Privacy",
    privacyResetDone: "Privacy policy restored to defaults.",
    privacyUpdated: "Privacy policy updated.",
    termsSettingsTitle: "Terms of Service",
    termsSettingsDescription:
      "Edit the Chinese and English terms shown for each frontend language.",
    termsSave: "Save Terms",
    termsResetDone: "Terms of service restored to defaults.",
    termsUpdated: "Terms of service updated.",
    legalChinese: "Chinese Markdown",
    legalEnglish: "English Markdown",
    footerTitle: "Footer Settings",
    footerDescription:
      "Customize the frontend footer description, sponsor button, and link columns. Leave blank to use the default footer settings.",
    footerIntroLabel: "Footer description",
    footerSponsorLabel: "Sponsor button text",
    footerSponsorUrl: "Sponsor button URL",
    footerSocialLinks: "Social icon links JSON",
    footerGroups: "Footer columns JSON",
    footerJsonHelp:
      'Social links use [{"label":"GitHub","href":"https://..."}]; columns use [{"title":"Product","links":[{"label":"Tools","href":"/tools"}]}].',
    footerSave: "Save Footer",
    footerReset: "Restore Defaults",
    footerResetDone: "Footer settings restored to defaults.",
    footerUpdated: "Footer settings updated.",
    footerJsonInvalid: "Footer JSON is not valid.",
    footerSocialJsonInvalid: "Social links JSON must contain label and href fields.",
    footerGroupsJsonInvalid: "Footer columns JSON must contain title and links fields.",
    homeSettingsTitle: "Homepage Copy",
    homeSettingsDescription:
      "Set the Chinese and English homepage hero copy separately. Leave fields blank to use the language defaults.",
    homeChinese: "Chinese Copy",
    homeEnglish: "English Copy",
    homeTitleTop: "First headline line",
    homeTitleBottom: "Second headline line",
    homeDescription: "Homepage description",
    homeSave: "Save Copy",
    homeReset: "Restore Defaults",
    homeResetDone: "Homepage copy restored.",
    homeUpdated: "Homepage copy updated.",
    githubSubmissionTitle: "GitHub Submission Settings",
    githubSubmissionDescription:
      "Configure the GitHub repository that receives public tool suggestions. Users continue to GitHub to review and create the issue.",
    securityTitle: "Admin Security Settings",
    securityDescription:
      "Manage the admin login password in one place. Update it regularly and avoid weak passwords.",
    securityCurrent: "Current password",
    securityNew: "New password",
    securityConfirm: "Confirm new password",
    securitySave: "Update Password",
    securityUpdatedAt: (date: string) => `Last updated: ${date}`,
    securityCurrentRequired: "Current password is required.",
    securityNewRequired: "New password is required.",
    securityConfirmRequired: "Confirm the new password.",
    securityMismatch: "The new passwords do not match.",
    securityCurrentIncorrect: "Current password is incorrect.",
    securityUnchanged: "The new password must be different from the current password.",
    securityUpdated: "Admin password updated.",
    backupTitle: "Backup and Restore",
    backupDescription:
      "Back up site content and settings, excluding passwords, secrets, and login sessions.",
    backupHelp:
      "Restoring overwrites current data. Export a backup first.",
    backupExport: "Export Backup",
    backupChoose: "Choose File",
    backupRestore: "Restore Backup",
    backupEmpty: "Choose a backup JSON file first.",
    backupInvalid: "Choose an HTools full backup JSON file.",
    backupTooLarge: "Keep the backup file under 10MB.",
    backupRestoreConfirm: (counts: BackupCounts) =>
      `Restore this backup? It will replace the current site with ${counts.tools} tools, ${counts.articles} articles, ${counts.contentSources} subscriptions, ${counts.contentItems} subscription items, ${counts.telegramMessages} push records, and ${counts.settings} settings.`,
    backupExported: (counts: BackupCounts) =>
      `Exported full backup: ${counts.tools} tools, ${counts.articles} articles, ${counts.contentSources} subscriptions, ${counts.contentItems} subscription items, ${counts.telegramMessages} push records, ${counts.settings} settings.`,
    backupReady: (name: string, counts: BackupCounts) =>
      `Loaded ${name}: ${counts.tools} tools, ${counts.articles} articles, ${counts.contentSources} subscriptions, ${counts.contentItems} subscription items, ${counts.telegramMessages} push records, ${counts.settings} settings.`,
    backupRestoreSummary: (result: BackupRestoreResponse) =>
      `Restore complete: ${result.counts.tools} tools, ${result.counts.articles} articles, ${result.counts.contentSources} subscriptions, ${result.counts.contentItems} subscription items, ${result.counts.telegramMessages} push records, ${result.counts.settings} settings.`,
    publicTitle: "My Subscription Feed",
    publicDescription:
      "Off by default. Once enabled, others can subscribe to the current tool list from the address below.",
    publicEnabled: "Enabled",
    publicDisabled: "Disabled",
    publicSourceUrlLabel: "Current subscription feed URL",
    githubSubmissionEnabledMessage: "GitHub Submission enabled.",
    githubSubmissionDisabledMessage: "GitHub Submission disabled.",
    publicEnabledMessage: "My Subscription Feed enabled.",
    publicDisabledMessage: "My Subscription Feed disabled.",
    proxyEnabledMessage: "Proxy Access enabled.",
    proxyDisabledMessage: "Proxy Access disabled.",
    serviceUnavailable: "Not configured",
    rssHubTitle: "RSSHub",
    rssHubDescription: "Convert rsshub:// subscription addresses copied from apps such as Folo into RSS URLs that HTools can synchronize. It is enabled by default, and the RSSHub service URL can be changed here.",
    rssHubUrlLabel: "RSSHub service URL",
    rssHubUrlPlaceholder: "https://rsshub.rssforever.com/",
    rssHubEnabled: "Enabled",
    rssHubDisabled: "Disabled",
    rssHubEnabledMessage: "RSSHub enabled.",
    rssHubDisabledMessage: "RSSHub disabled.",
    rssHubSave: "Save Settings",
    rssHubUpdated: "RSSHub settings saved.",
    turnstileTitle: "Cloudflare Turnstile",
    turnstileDescription: "Protects admin login while reducing malicious attempts. Configure both variables below in the project to enable or disable it; secrets are never shown in the admin interface.",
    turnstileSiteKeyLabel: "Cloudflare Site Key",
    turnstileSecretKeyLabel: "Cloudflare Secret Key",
    turnstileEnabled: "Enabled",
    turnstileDisabled: "Disabled",
    turnstileEnabledMessage: "Cloudflare Turnstile enabled.",
    turnstileDisabledMessage: "Cloudflare Turnstile disabled.",
    imageBedTitle: "CloudFlare ImgBed",
    imageBedDescription: "Upload PNG, JPEG, WebP, GIF, or AVIF images up to 10 MB for tools, articles, and Telegram pushes. The deployment provides the API token, while the service URL and upload options are configured here.",
    imageBedTokenLabel: "API token with upload permission only",
    imageBedUrlLabel: "Image bed service URL",
    imageBedUrlPlaceholder: "https://img.example.com/",
    imageBedChannelLabel: "Upload channel",
    imageBedChannelTelegram: "Telegram",
    imageBedChannelR2: "Cloudflare R2",
    imageBedChannelS3: "S3",
    imageBedChannelDiscord: "Discord",
    imageBedChannelHuggingFace: "HuggingFace",
    imageBedChannelWebDav: "WebDAV",
    imageBedChannelNameLabel: "Channel name",
    imageBedChannelNamePlaceholder: "Optional for multiple channels",
    imageBedNameTypeLabel: "File naming",
    imageBedNameTypeDefault: "Prefix + original name",
    imageBedNameTypeIndex: "Prefix only",
    imageBedNameTypeOrigin: "Original name only",
    imageBedNameTypeShort: "Short link",
    imageBedFolderLabel: "Upload folder",
    imageBedFolderPlaceholder: "Optional, for example htools/images",
    imageBedEnabled: "Enabled",
    imageBedDisabled: "Disabled",
    imageBedSave: "Save Settings",
    imageBedUpdated: "Image bed settings saved.",
    imageBedEnabledMessage: "Image upload enabled.",
    imageBedDisabledMessage: "Image upload disabled.",
    telegramTitle: "Telegram Push",
    telegramDescription: "Manually push tools, articles, or custom messages to a Telegram account, group, or channel. The deployment provides the bot token, and the recipient is configured here.",
    telegramTokenLabel: "Notification bot token",
    telegramTargetLabel: "Recipient user, group, or channel ID",
    telegramTargetPlaceholder: "-1001234567890 or @channelname",
    telegramEnabled: "Enabled",
    telegramDisabled: "Disabled",
    telegramSave: "Save Settings",
    telegramTest: "Test Connection",
    telegramFooterLabel: "Fixed message footer Markdown",
    telegramFooterPlaceholder: "[Channel](https://t.me/example) ｜ [Chat](https://t.me/example_group)",
    telegramUpdated: "Telegram push settings saved.",
    telegramEnabledMessage: "Telegram Push enabled.",
    telegramDisabledMessage: "Telegram Push disabled.",
    telegramSaveBeforeEnable: "Save the current settings before enabling Telegram push.",
    telegramConnected: (title: string, bot: string, unsaved: boolean) =>
      `Connected to ${title}${bot ? ` with @${bot}` : ""}.${unsaved ? " The current target has not been saved." : ""}`,
    umamiTitle: "Umami Analytics",
    umamiDescription: "Connect self-hosted Umami or Umami Cloud to measure site visits. Save a complete configuration here before enabling or disabling analytics.",
    umamiScriptUrlLabel: "Analytics script URL",
    umamiScriptUrlPlaceholder: "https://example.com/script.js",
    umamiWebsiteIdLabel: "Website ID",
    umamiWebsiteIdPlaceholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    umamiEnabled: "Enabled",
    umamiDisabled: "Disabled",
    umamiSave: "Save Settings",
    umamiUpdated: "Umami settings saved.",
    umamiEnabledMessage: "Umami analytics enabled.",
    umamiDisabledMessage: "Umami analytics disabled.",
    umamiRequired: "Save the analytics script URL and Website ID before enabling analytics.",
    umamiInvalidUrl: "Enter a valid Umami analytics script URL.",
    proxyTitle: "Proxy Access",
    proxyDescription:
      "Proxy external images or links that cannot be reached directly, limited to the scope selected below; internal pages, APIs, and the site icon remain direct.\n\nCaution: enable this carefully. Some sites, image hotlink protection, or login redirects may be incompatible with the proxy. If the page displays incorrectly after enabling it, disable the proxy first or change proxy services.",
    proxyHelp:
      "Full-site proxy handles external links and images; Images only covers tool previews, article images, subscription-content covers, and other image resources while regular external links remain direct. Direct prefix uses “proxy URL + target URL”; Edgeone-Proxy Standard uses `/proxy?url=`; Edgeone-Proxy Advanced uses `/advanced-proxy?url=`.\n\nHTools does not include a proxy service. Deploy a proxy project separately and enter its deployment URL if needed.",
    proxyEnabled: "Enabled",
    proxyDisabled: "Disabled",
    proxyUrlLabel: "Proxy service URL",
    proxyPlaceholder: "https://your-proxy.example.com/",
    proxyScopeLabel: "Proxy scope",
    proxyScopeAll: "Full-site proxy",
    proxyScopeImages: "Images only",
    proxyModeLabel: "Proxy access rule",
    proxyModePrefix: "Direct prefix",
    proxyModeEdgeOneProxy: "Edgeone-Proxy Standard",
    proxyModeEdgeOneAdvanced: "Edgeone-Proxy Advanced",
    proxyProjectLink: "Edgeone-Proxy Project",
    proxySave: "Save Settings",
    proxyRequired: "Enter a proxy service URL before enabling proxy fallback.",
    proxyInvalid: "Proxy service URL must be a valid http/https URL.",
    proxyUpdated: "Proxy settings updated.",
    resetTitle: "Restore Defaults",
    resetDescription:
      "Clear tools, articles, subscriptions, categories, and push records. Disable the site's subscription feed.",
    resetWarning: "Keep system settings, passwords, and sent Telegram messages. Back up first.",
    resetButton: "Restore",
    resetConfirm:
      "Restore defaults? This will delete tools, articles, subscription content, saved categories, and disable the site source.",
    resetDone: (result: FactoryResetResponse) =>
      `Restored defaults: deleted ${result.counts.tools} tools, ${result.counts.articles} articles, ${result.counts.contentSources} subscriptions, ${result.counts.contentItems} subscription items, and ${result.counts.telegramMessages} push records.`,
    linkModuleTitle: "Site Link Check",
    linkModuleDescription:
      "Check whether stored project URLs and demo sites are reachable. Results are display-only and do not modify URLs.",
    urlLabel: "Project URL",
    demoUrlLabel: "Demo site"
  };
}

export function getAdminWorkspaceText(locale: Locale) {
  if (locale === "zh") {
    const scopeLabels: Record<AdminCategoryScope, string> = {
      tools: "\u5de5\u5177\u5e93",
      articles: "\u6587\u7ae0\u7ba1\u7406",
      push: "\u6d88\u606f\u63a8\u9001",
      content: "\u8ba2\u9605\u5185\u5bb9"
    };

    return {
      articleLoadFailed: "\u65e0\u6cd5\u52a0\u8f7d\u6587\u7ae0\u3002",
      category: {
        topLabel: "\u65b0\u589e/\u7b5b\u9009\u5206\u7c7b",
        toolLabel: "\u5de5\u5177\u5206\u7c7b",
        articleLabel: "\u6587\u7ae0\u5206\u7c7b",
        contentLabel: "\u8ba2\u9605\u5206\u7c7b",
        pushLabel: "\u63a8\u9001\u5206\u7c7b",
        inputPlaceholder: "\u8f93\u5165\u65b0\u589e\u5206\u7c7b",
        empty: "\u6ca1\u6709\u627e\u5230\u5206\u7c7b",
        createLabel: (category: string) => `\u65b0\u589e\u5206\u7c7b\uff1a${category}`,
        clearAllAction: "\u6e05\u7a7a\u5168\u90e8\u5185\u5bb9",
        deleteLabel: (label: string) => `\u5220\u9664\u5206\u7c7b\uff1a${label}`,
        moveLabel: (label: string) => `\u4e0a\u79fb\u5206\u7c7b\uff1a${label}`,
        scopeLabel: (scope: AdminCategoryScope) => scopeLabels[scope],
        loadFailed: "\u65e0\u6cd5\u52a0\u8f7d\u5206\u7c7b\u3002",
        updateFailed: "\u65e0\u6cd5\u66f4\u65b0\u5206\u7c7b\u3002",
        migrationTargetRequired: "\u8bf7\u9009\u62e9\u8981\u8fc1\u79fb\u5230\u7684\u5206\u7c7b\u3002",
        clearTitle: (scopeLabel: string) => `\u6e05\u7a7a${scopeLabel}`,
        manageTitle: (label: string) => `\u5904\u7406\u5206\u7c7b\u201c${label}\u201d`,
        deleteWithContentAction: "\u5220\u9664\u5206\u7c7b\u53ca\u5185\u5bb9",
        migrateAction: "\u8fc1\u79fb\u5185\u5bb9",
        clearDescription: (scopeLabel: string, count: number) =>
          `\u8fd9\u5c06\u6e05\u7a7a${scopeLabel}\u4e2d\u7684 ${count} \u6761\u5185\u5bb9\u3002`,
        clearDescriptionWithoutCount: (scopeLabel: string) =>
          `\u8fd9\u5c06\u6e05\u7a7a${scopeLabel}\u4e2d\u7684\u5168\u90e8\u5185\u5bb9\u3002`,
        pushSourceScopeLabel: (label: string) => `${label}\u63a8\u9001`,
        pushCategoryDescription:
          "\u53ef\u5c06\u6b64\u5206\u7c7b\u4e0b\u7684\u63a8\u9001\u8bb0\u5f55\u8fc1\u79fb\u5230\u5176\u4ed6\u5206\u7c7b\uff0c\u6216\u5220\u9664\u5206\u7c7b\u53ca\u5176\u5168\u90e8\u8bb0\u5f55\u3002",
        occupiedDescription: (count: number) =>
          `\u8fd9\u4e2a\u5206\u7c7b\u4e0b\u8fd8\u6709 ${count} \u6761\u5185\u5bb9\u3002\u53ef\u4ee5\u8fc1\u79fb\u5230\u5176\u4ed6\u5206\u7c7b\uff0c\u4e5f\u53ef\u4ee5\u5220\u9664\u5206\u7c7b\u53ca\u5185\u5bb9\u3002`,
        contentClearDescription: (sourceCount: number, itemCount: number) =>
          `\u8fd9\u5c06\u6e05\u7a7a\u8ba2\u9605\u5185\u5bb9\u4e2d\u7684 ${describeSubscriptionPayloadZh(sourceCount, itemCount)}\u3002`,
        contentOccupiedDescription: (sourceCount: number, itemCount: number) =>
          `\u8fd9\u4e2a\u5206\u7c7b\u4e0b\u8fd8\u6709 ${describeSubscriptionPayloadZh(sourceCount, itemCount)}\u3002\u53ef\u4ee5\u8fc1\u79fb\u5230\u5176\u4ed6\u5206\u7c7b\uff0c\u4e5f\u53ef\u4ee5\u5220\u9664\u5206\u7c7b\u53ca\u5185\u5bb9\u3002`,
        migrateToLabel: "\u8fc1\u79fb\u5230\u5206\u7c7b",
        migrateHelp: "\u53ef\u9009\u62e9\u5df2\u6709\u5206\u7c7b\uff0c\u4e5f\u53ef\u4ee5\u8f93\u5165\u65b0\u5206\u7c7b\u3002",
        selectOrCreateLabel: (label: string) => `选择或新建${label}`,
        requiredLabel: (label: string) => `请先选择${label}。`,
        cleared: (scopeLabel: string) => `${scopeLabel}\u5df2\u6e05\u7a7a\u5168\u90e8\u5185\u5bb9\u3002`,
        refreshFailedHint: "\u5217\u8868\u5237\u65b0\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u52a0\u8f7d\u9875\u9762\u3002",
        featuredCleared: "\u5de5\u5177\u5e93\u5df2\u53d6\u6d88\u6240\u6709\u7cbe\u9009\u5de5\u5177\u3002",
        removed: (label: string, scopeLabel: string) =>
          `\u5206\u7c7b\u201c${label}\u201d\u5df2\u4ece${scopeLabel}\u5220\u9664\u3002`,
        migrated: (label: string, targetLabel: string, affected: number) =>
          `\u5206\u7c7b\u201c${label}\u201d\u4e0b\u7684 ${affected} \u6761\u5185\u5bb9\u5df2\u8fc1\u79fb\u5230\u201c${targetLabel}\u201d\u3002`
      }
    };
  }

  const scopeLabels: Record<AdminCategoryScope, string> = {
    tools: "Tools",
    articles: "Articles",
    push: "Message Push",
    content: "Subscription Content"
  };

  return {
    articleLoadFailed: "Unable to load article.",
    category: {
      topLabel: "Create / Filter Category",
      toolLabel: "Tool category",
      articleLabel: "Article category",
      contentLabel: "Subscription category",
      pushLabel: "Push category",
      inputPlaceholder: "Type to add category",
      empty: "No matching categories",
      createLabel: (category: string) => `Create category: ${category}`,
      clearAllAction: "Clear all content",
      deleteLabel: (label: string) => `Delete category: ${label}`,
      moveLabel: (label: string) => `Move category up: ${label}`,
      scopeLabel: (scope: AdminCategoryScope) => scopeLabels[scope],
      loadFailed: "Unable to load categories.",
      updateFailed: "Unable to update category.",
      migrationTargetRequired: "Choose a category to migrate into.",
      clearTitle: (scopeLabel: string) => `Clear ${scopeLabel}`,
      manageTitle: (label: string) => `Manage category "${label}"`,
      deleteWithContentAction: "Delete category and content",
      migrateAction: "Migrate content",
      clearDescription: (scopeLabel: string, count: number) =>
        `This will clear ${count} items from ${scopeLabel}.`,
      clearDescriptionWithoutCount: (scopeLabel: string) =>
        `This will clear all content from ${scopeLabel}.`,
      pushSourceScopeLabel: (label: string) => `${label} pushes`,
      pushCategoryDescription:
        "Move this category's push records into another category, or delete the category and all of its records.",
      occupiedDescription: (count: number) =>
        `This category still has ${count} items. You can migrate them to another category or delete the category and its content.`,
      contentClearDescription: (sourceCount: number, itemCount: number) =>
        `This will delete ${describeSubscriptionPayloadEn(sourceCount, itemCount)} from Subscription Content.`,
      contentOccupiedDescription: (sourceCount: number, itemCount: number) =>
        `This category still has ${describeSubscriptionPayloadEn(sourceCount, itemCount)}. You can migrate them to another category or delete the category and its content.`,
      migrateToLabel: "Migrate to category",
      migrateHelp: "Choose an existing category or type a new one.",
      selectOrCreateLabel: (label: string) =>
        `Select or create ${withEnglishArticle(label.toLowerCase())}`,
      requiredLabel: (label: string) => `Select ${label.toLowerCase()} first.`,
      cleared: (scopeLabel: string) =>
        `${scopeLabel}: all content has been cleared.`,
      refreshFailedHint: "The list failed to refresh. Please reload the page.",
      featuredCleared: "Tools: all featured tools have been unfeatured.",
      removed: (label: string, scopeLabel: string) =>
        `Category "${label}" removed from ${scopeLabel}.`,
      migrated: (label: string, targetLabel: string, affected: number) =>
        `${affected} items from "${label}" moved to "${targetLabel}".`
    }
  };
}

export function getContentFlowText(locale: Locale) {
  if (locale === "zh") {
    return {
      nav: "订阅内容",
      title: "订阅内容",
      allSources: "全部",
      allSubscriptions: "全部订阅",
      uncategorized: "未分类",
      expandCategory: "展开分类",
      collapseCategory: "收起分类",
      categoryToggleHint: "单击筛选该分类，双击展开或收起订阅",
      description: "从 RSS 源同步外部内容，筛选后可转为站内文章。",
      addSource: "添加订阅",
      addSourceDescription: "填写订阅地址、分类和默认标签，保存后将用于后续内容同步。",
      addContent: "添加订阅",
      editSource: "编辑订阅",
      editSourceDescription: "修改订阅地址、分类和默认标签，保存后将用于后续内容同步。",
      deleteSource: "删除订阅",
      syncSource: "同步",
      preview: "内容预览",
      saveSource: "保存订阅",
      sourceTitleLabel: "标题",
      sourceTitlePlaceholder: "留空则使用 RSS 标题",
      sourceUrlLabel: "RSS 源地址",
      sourceUrlPlaceholder: "https://example.com/feed.xml 或 rsshub://example/route",
      categoryLabel: "订阅分类",
      categoryPlaceholder: "选择或新建订阅分类",
      tagsLabel: "默认标签",
      tagsPlaceholder: ADMIN_RESOURCE_FIELD_EXAMPLES.zh.adminTags,
      enabledLabel: "启用订阅",
      disabledLabel: "停用订阅",
      enabledDraftEnabled: "订阅状态已改为启用，请点击保存订阅生效。",
      enabledDraftDisabled: "订阅状态已改为停用，请点击保存订阅生效。",
      searchPlaceholder: "搜索内容",
      sourceEmptyTitle: "还没有订阅",
      sourceEmptyDescription: "添加 RSS 源地址后，可以同步外部文章、视频或社交内容。",
      itemEmptyTitle: "还没有内容",
      itemEmptyDescription: "添加订阅并点击同步后，内容会显示在这里。",
      noMatchTitle: "没有匹配内容",
      noMatchDescription: "换个分类、来源或搜索词再试。",
      feedUrlNotAllowed: "该 RSS 源地址无效或不允许访问，请使用公开的 http/https 地址或有效的 rsshub:// 地址。",
      sourceAlreadyExists: "该订阅已经添加，请勿重复保存。",
      rssHubNotConfigured: "RSSHub 已关闭，请先在系统设置的服务设置中开启。",
      feedRedirectNotAllowed: "RSS 地址跳转到了不允许访问的地址。",
      feedTimeout: "RSS 请求超时，请稍后重试或更换地址。",
      feedTooLarge: "RSS 响应超过 5 MB，无法读取。",
      feedTooManyRedirects: "RSS 地址跳转次数过多，无法读取。",
      feedTypeUnsupported: "该地址返回的内容类型不是可识别的 RSS 文本。",
      feedEmpty: "RSS 返回了空内容。",
      feedNoItems: "RSS 中没有找到可同步的内容。",
      feedRequestFailed: (status: string) => `RSS 请求失败，状态码 ${status}。`,
      loadMore: "加载更多",
      previewTitle: "预览结果",
      previewLoaded: (count: number) => `预览已加载，共 ${count} 条内容。`,
      convert: "转为文章",
      updateArticle: "更新文章",
      updateArticleAction: "更新文章",
      updateArticleTitle: "更新文章设置",
      updateArticleDescription:
        "只更新文章分类和发布状态，不会覆盖已经编辑过的标题、摘要和正文。",
      convertCategoryTitle: "选择文章分类",
      convertCategoryDescription:
        "请选择文章管理中的分类；也可以输入新分类，转换后会用于前台文章分流。",
      convertCategoryAction: "转为文章",
      convertPublishLabel: "发布方式",
      convertAsDraft: "存为草稿",
      convertAsPublished: "直接发布",
      convertPublishDraftTip: "已切换为草稿，请确认。",
      convertPublishPublishedTip: "已切换为直接发布，请确认。",
      convertPreviewTitle: "浏览内容",
      convertPreviewLoading: "正在读取文章内容。",
      convertPreviewUnavailable: "暂时无法浏览文章内容。",
      openOriginal: "打开原文",
      openOriginalShort: "原文",
      saved: "订阅已保存。",
      savedSyncFailed: (message: string) => `订阅已保存，但首次同步失败：${message}`,
      deleted: "订阅已删除。",
      synced: (imported: number, updated: number) =>
        `同步完成：新增 ${imported} 条，刷新 ${updated} 条。`,
      syncCategory: "同步分类",
      syncedCategory: (sources: number, imported: number, updated: number) =>
        `已同步 ${sources} 个订阅：新增 ${imported} 条，刷新 ${updated} 条。`,
      syncedCategoryPartial: (failed: number) => `其中 ${failed} 个订阅同步失败。`,
      convertedDraftDone: "已转为文章并存为草稿，可在文章管理中继续编辑或发布。",
      convertedPublishedDone: "已转为文章并直接发布，前台文章页可直接访问。",
      updatedDraftDone: "文章分类和发布状态已更新，当前存为草稿。",
      updatedPublishedDone: "文章分类和发布状态已更新，当前已发布。",
      deleteConfirmTitle: "删除这个订阅吗？",
      deleteConfirmDescription: "删除后，此订阅下已同步的内容条目也会一起删除。"
    };
  }

  return {
    nav: "Subscription Content",
    title: "Subscription Content",
    allSources: "All",
    allSubscriptions: "All Subscriptions",
    uncategorized: "Uncategorized",
    expandCategory: "expand category",
    collapseCategory: "collapse category",
    categoryToggleHint:
      "Click to filter this category, double-click to expand or collapse its subscriptions",
    description:
      "Sync external RSS feeds, filter entries, and convert selected items into site articles.",
    addSource: "Add Subscription",
    addSourceDescription:
      "Enter the feed URL, category, and default tags for future content syncs.",
    addContent: "Add Subscription",
    editSource: "Edit Subscription",
    editSourceDescription:
      "Edit the feed URL, category, and default tags used by future content syncs.",
    deleteSource: "Delete Subscription",
    syncSource: "Sync",
    preview: "Content Preview",
    saveSource: "Save Subscription",
    sourceTitleLabel: "Title",
    sourceTitlePlaceholder: "Leave blank to use the RSS title",
    sourceUrlLabel: "RSS URL",
    sourceUrlPlaceholder: "https://example.com/feed.xml or rsshub://example/route",
    categoryLabel: "Subscription category",
    categoryPlaceholder: "Select or create a subscription category",
    tagsLabel: "Default tags",
    tagsPlaceholder: ADMIN_RESOURCE_FIELD_EXAMPLES.en.adminTags,
    enabledLabel: "Enable Subscription",
    disabledLabel: "Disable Subscription",
    enabledDraftEnabled: "Subscription status changed to enabled. Save the subscription to apply it.",
    enabledDraftDisabled: "Subscription status changed to disabled. Save the subscription to apply it.",
    searchPlaceholder: "Search content",
    sourceEmptyTitle: "No subscriptions yet",
    sourceEmptyDescription:
      "Add RSS URLs to sync external articles, videos, or social content.",
    itemEmptyTitle: "No content yet",
    itemEmptyDescription: "Add a subscription and sync it to show entries here.",
    noMatchTitle: "No matching content",
    noMatchDescription: "Try another category, source, or search term.",
    feedUrlNotAllowed: "This RSS URL is invalid or not allowed. Use a public http/https URL or a valid rsshub:// URL.",
    sourceAlreadyExists: "This subscription has already been added.",
    rssHubNotConfigured: "RSSHub is disabled. Enable it in System Settings > Services first.",
    feedRedirectNotAllowed: "The feed redirected to a URL that is not allowed.",
    feedTimeout: "The feed request timed out. Try again later or use another URL.",
    feedTooLarge: "The feed response exceeds 5 MB and cannot be read.",
    feedTooManyRedirects: "The feed redirected too many times.",
    feedTypeUnsupported: "The URL did not return a supported RSS text type.",
    feedEmpty: "The feed returned an empty response.",
    feedNoItems: "No syncable items were found in the feed.",
    feedRequestFailed: (status: string) => `Feed request failed with status ${status}.`,
    loadMore: "Load more",
    previewTitle: "Preview",
    previewLoaded: (count: number) => `Preview loaded with ${count} items.`,
    convert: "Convert",
    updateArticle: "Update article",
    updateArticleAction: "Update article",
    updateArticleTitle: "Update article settings",
    updateArticleDescription:
      "Only the category and publish status will change. The edited title, summary, and content are preserved.",
    convertCategoryTitle: "Select article category",
    convertCategoryDescription:
      "Choose a category from article management, or create a new one for the public article filter.",
    convertCategoryAction: "Convert to article",
    convertPublishLabel: "Publish mode",
    convertAsDraft: "Save draft",
    convertAsPublished: "Publish",
    convertPublishDraftTip:
      "Switched to draft. Confirm to apply.",
    convertPublishPublishedTip:
      "Switched to publish. Confirm to apply.",
    convertPreviewTitle: "View content",
    convertPreviewLoading: "Loading article content.",
    convertPreviewUnavailable: "Article content is unavailable.",
    openOriginal: "Open Original",
    openOriginalShort: "Open",
    saved: "Subscription saved.",
    savedSyncFailed: (message: string) =>
      `Subscription saved, but the initial sync failed: ${message}`,
    deleted: "Subscription deleted.",
    synced: (imported: number, updated: number) =>
      `Sync complete: ${imported} imported, ${updated} refreshed.`,
    syncCategory: "Sync Category",
    syncedCategory: (sources: number, imported: number, updated: number) =>
      `Synced ${sources} subscriptions: ${imported} imported, ${updated} refreshed.`,
    syncedCategoryPartial: (failed: number) =>
      `${failed} subscriptions failed to sync.`,
    convertedDraftDone:
      "Converted to an article draft. You can edit or publish it in article management.",
    convertedPublishedDone:
      "Converted and published. The public article page is now available.",
    updatedDraftDone: "The article category and status were updated as a draft.",
    updatedPublishedDone: "The article category and status were updated and published.",
    deleteConfirmTitle: "Delete this subscription?",
    deleteConfirmDescription:
      "Synced content under this subscription will also be deleted."
  };
}

export type AdminCategoryText = ReturnType<typeof getAdminWorkspaceText>["category"];

// 订阅内容删除确认弹窗的说明文字。放在这里而不是页面里,是为了能被真实执行的测试覆盖。
// 三种情形:
// 1. 具名分类 —— 说清这个分类下有几个订阅、几条内容(为 0 的那段由文案函数自己省掉)。
// 2. "全部"且工作区非空 —— 同上,说两个数。
// 3. "全部"且一个订阅一条内容都没有 —— **这一支必须回退到不带数字的那句**:
//    具名分类有守卫拦着(没东西可删就不弹窗),但"全部"这一支是无条件弹窗的,
//    如果还去拼数字就会得到"这将清空订阅内容中的 。"这种缺一块的句子。
//    回退用的是消息推送批量清空早就在用的同一条文案,不新造词。
export function getContentCategoryActionDescription(
  categoryText: AdminCategoryText,
  options: { isAll: boolean; sourceCount: number; itemCount: number }
) {
  const { isAll, sourceCount, itemCount } = options;

  if (!isAll) {
    return categoryText.contentOccupiedDescription(sourceCount, itemCount);
  }

  if (sourceCount + itemCount === 0) {
    return categoryText.clearDescriptionWithoutCount(
      categoryText.scopeLabel("content")
    );
  }

  return categoryText.contentClearDescription(sourceCount, itemCount);
}
