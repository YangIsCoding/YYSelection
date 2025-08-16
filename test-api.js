// 簡單測試API端點
const testAPI = async () => {
  try {
    console.log('測試儀表板統計API...')
    
    // 測試不需要認證的基本連接
    const response = await fetch('http://localhost:3000/api/admin/dashboard/stats')
    console.log('HTTP狀態碼:', response.status)
    
    if (response.status === 401) {
      console.log('✅ API正常運行（返回401未授權是預期的）')
    } else {
      const data = await response.json()
      console.log('返回數據:', data)
    }
  } catch (error) {
    console.error('❌ API錯誤:', error.message)
  }
}

testAPI()