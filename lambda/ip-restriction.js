function handler(event) {
  var request = event.request
  var clientIP = event.viewer.ip
  // 社内IP
  var IP_WHITE_LIST = [""]
  var isPermittedIp = IP_WHITE_LIST.includes(clientIP)

  if (isPermittedIp) {
    return request
  }
  return {
    statusCode: 403,
    statusDescription: "Forbidden",
  }
}
