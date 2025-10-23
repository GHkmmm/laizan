!macro customInstall
  ; 创建桌面快捷方式，使用可执行文件自带的图标
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 "" "" "$INSTDIR"
  
  ; 备用方案：如果上面的方法不行，尝试使用PNG图标
  ; CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\resources\app.asar.unpacked\resources\icon.png" 0 "" "" "$INSTDIR"
!macroend

!macro customUnInstall
  ; 删除桌面快捷方式
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
!macroend
