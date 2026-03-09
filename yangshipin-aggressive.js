[mitm]
hostname = *.yangshipin.cn, *.ysp.cntv.cn, *.cntv.cn, *.cbox.cntv.cn
[rewrite_local]
^https?://.*\.(yangshipin|cbox)\.cntv\.cn url script-response-body https://raw.githubusercontent.com/fyrs3101/Scripts/refs/heads/master/yangshipin-aggressive.js
^https?://.*\.yangshipin\.cn url script-response-body https://raw.githubusercontent.com/fyrs3101/Scripts/refs/heads/master/yangshipin-aggressive.js
// 激进版央视频解锁 - Quantumult X / Surge(MITM+Script) / Loon
// 目标：尽可能强制解锁超清、4K、会员专享、付费点播、回看等
// 扩展覆盖更多API接口：用户信息、视频详情、播放URL、直播、搜索、合集、会员校验等
// 最后更新参考时间：2026年初可能仍部分有效，实际请抓包验证字段名

let url = $request.url;
let body = $response.body;

if (body) {
  try {
    let obj = JSON.parse(body);
    let obj;
try {
    obj = JSON.parse(body || '{}');
} catch (e) {
    console.log("JSON 解析失败:", e, "原始body前100:", body?.slice(0,100));
    $done({body});
    return;
}

    // ─────────────── 通用暴力覆盖 ───────────────
    if (obj.data) {
      // 会员/VIP/付费相关
      obj.data.vip = 1;
      obj.data.is_vip = true;
      obj.data.vip_level = 3;               // 最高级
      obj.data.vip_type = "super";          // 或 "diamond"、"year"
      obj.data.is_super_vip = true;
      obj.data.super_vip = true;
      obj.data.vip_end_time = "2099-12-31T23:59:59Z";
      obj.data.vip_end_date = "2099-12-31";
      obj.data.remain_days = 9999;
      obj.data.vip_icon = "https://example.com/vip.png";
      
      // 播放权限相关
      obj.data.play_auth = true;
      obj.data.can_play = true;
      obj.data.free_play = true;
      obj.data.vip_play = true;
      obj.data.is_pay = false;
      obj.data.fee_type = 0;
      obj.data.need_pay = false;
      obj.data.pay_status = 1;
      obj.data.is_free = true;
      obj.data.free = true;
      
      // 清晰度/格式强制最高
      if (obj.data.definition) {
        obj.data.definition = "4K";
      }
      if (obj.data.max_definition) {
        obj.data.max_definition = "4K";
      }
      if (obj.data.streams) {
        obj.data.streams.forEach(stream => {
          stream.definition = "4K";
          stream.free = true;
          stream.vip_free = true;
        });
      }
      
      // 去限制/试看
      obj.data.trial = false;
      obj.data.is_trail = false;
      obj.data.trail_duration = 0;
      delete obj.data.limit_duration;
      delete obj.data.preview_duration;
      
      // 去广告/弹窗
      obj.data.ad = false;
      obj.data.has_ad = false;
      if (obj.data.ads) obj.data.ads = [];
      if (obj.data.ad_list) obj.data.ad_list = [];
    }

    // ─────────────── 特定接口针对性处理 ───────────────
    // 1. 用户特权/会员信息接口（扩展覆盖更多变体）
    if (url.includes("/user/privilege") || 
        url.includes("/v1/user/privilege") || 
        url.includes("/member/status") ||
        url.includes("/vip/info") ||
        url.includes("/user/info") ||    // 新增：用户个人信息
        url.includes("/member/info") ||  // 新增：会员详情
        url.includes("/user/vip") ||     // 新增：VIP状态
        url.includes("/api/v1/user")) {  // 新增：API v1用户相关
        
      if (obj.data) {
        obj.data.status = 1;
        obj.data.is_valid = true;
        obj.data.level = 3;
        obj.data.expire_time = "2099-12-31";
        obj.data.vip_status = 1;       // 新增
        obj.data.member_type = "super"; // 新增
      }
      if (obj.result) obj.result = 0;  // 有的接口用result=0表示成功
    }

    // 2. 视频播放信息/鉴权接口（扩展覆盖更多播放相关）
    if (url.includes("/video/info") || 
        url.includes("/play/info") || 
        url.includes("/playurl") || 
        url.includes("/auth") || 
        url.includes("/playback") ||
        url.includes("/stream") ||
        url.includes("/video/detail") ||  // 新增：视频详情
        url.includes("/play/url") ||      // 新增：播放URL
        url.includes("/video/play") ||    // 新增：视频播放
        url.includes("/api/v1/video") ||  // 新增：API v1视频相关
        url.includes("/api/v1/play")) {   // 新增
        
      if (obj.data) {
        obj.data.auth = true;
        obj.data.authorized = true;
        obj.data.playable = true;
        obj.data.forbidden = false;
        obj.data.code = 0;           // 抹掉错误码
        obj.data.message = "success";
        
        // 强制所有流可播
        if (obj.data.urls || obj.data.flv || obj.data.hls || obj.data.dash) {
          let streams = obj.data.urls || obj.data.flv || obj.data.hls || obj.data.dash;
          if (Array.isArray(streams)) {
            streams.forEach(s => {
              s.free = true;
              s.auth = true;
              s.pay = false;
              s.fee = 0;
            });
          }
        }
        
        // 新增：处理m3u8或直接URL
        if (obj.data.m3u8) {
          obj.data.m3u8.free = true;
        }
        if (obj.data.play_url) {
          obj.data.play_url.free = true;
          obj.data.play_url.vip_required = false;
        }
      }
      
      // 有的接口直接返回code/message
      if (obj.code && obj.code < 0) {
        obj.code = 0;
        obj.msg = obj.message = "success";
      }
    }

    // 3. 专区/合集/付费内容列表（扩展覆盖搜索和合集）
    if (url.includes("/album") || 
        url.includes("/collection") || 
        url.includes("/recommend") ||
        url.includes("/search") ||        // 新增：搜索结果
        url.includes("/album/list") ||    // 新增：合集列表
        url.includes("/series") ||        // 新增：系列
        url.includes("/api/v1/album") ||  // 新增
        url.includes("/api/v1/search")) { // 新增
        
      if (obj.data && Array.isArray(obj.data.list)) {
        obj.data.list.forEach(item => {
          item.is_vip = false;
          item.vip_free = true;
          item.free = true;
          item.pay = false;
          item.need_vip = false;      // 新增
          item.fee = 0;               // 新增
        });
      }
      if (obj.data && obj.data.items) {  // 有的用items
        obj.data.items.forEach(item => {
          item.is_vip = false;
          item.vip_free = true;
          item.free = true;
          item.pay = false;
        });
      }
    }

    // 4. 新增：直播相关接口覆盖
    if (url.includes("/live/info") || 
        url.includes("/live/play") || 
        url.includes("/channel/list") || 
        url.includes("/live/stream") || 
        url.includes("/api/v1/live")) {
        
      if (obj.data) {
        obj.data.live_auth = true;
        obj.data.can_watch = true;
        obj.data.is_free = true;
        obj.data.vip_required = false;
        
        if (obj.data.channels) {
          obj.data.channels.forEach(ch => {
            ch.free = true;
            ch.vip = false;
          });
        }
      }
    }

    // 5. 新增：会员校验/支付相关接口
    if (url.includes("/member/check") || 
        url.includes("/pay/status") || 
        url.includes("/vip/verify") || 
        url.includes("/api/v1/pay")) {
        
      if (obj.data) {
        obj.data.paid = true;
        obj.data.verified = true;
        obj.data.vip_valid = true;
      }
      obj.code = 0;
      obj.message = "success";
    }

    // ─────────────── 兜底处理 ───────────────
    // 错误码统一抹0
    if (obj.code && obj.code !== 0) obj.code = 0;
    if (obj.status && obj.status < 0) obj.status = 0;
    if (obj.err_code) obj.err_code = 0;
    if (obj.result_code) obj.result_code = 0;  // 新增

    body = JSON.stringify(obj);
  } catch (e) {
    console.log("央视频激进解锁脚本解析出错：" + e);
  }
}

$done({ body });
