function msg(title,time){ // 提示弹窗
  var copy = msg; /* 备份函数 */
  var msgBox = $("<div class='msg-box-wrap'><div class='msg-box'>"+ title +"</div></div>");
      msgBox.remove();
      $('body').append(msgBox);
  if(!time){
      var time = 1000;
  };
  msg = function(){};  /* 销毁函数 */
  setTimeout(function(){
      msgBox.remove();
      msg = copy; /* 恢复函数 */
  },time);   
};
// msg('加入官方')
function loading(next){ // 数据加载动画
  var text = '正在提交中...';
  if (typeof next === 'string') {
      text = next
  }
  var loadingBox = '<div class="loading-bg-wrap"><div class="loading-bg">'+
                      '<div class="loading"></div>'+
                      '<p>'+ text +'</p>';
                  '</div></div>';
  next === false ?  $('.loading-bg-wrap').remove() : $('body').append(loadingBox);          
};