[MITM]
hostname = *.yangshipin.cn, *.cctv.cn
[rewrite_local]
# 会员解锁
^https?:\/\/mobile\.yangshipin\.cn\/vapi\/user\/vip url script-response-body https://raw.githubusercontent.com/fyrs3101/Scripts/refs/heads/master/yangshipin.js
# 广告去除
^https?:\/\/ads\.yangshipin\.cn\/.+ url reject
let obj = JSON.parse($response.body);
obj.data.vip = {
  "expireTime": "2099-12-31",
  "type": 1,
  "status": 1
};
$done({body: JSON.stringify(obj)});
