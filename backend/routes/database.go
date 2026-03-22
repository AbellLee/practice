package routes

import (
	"practice-system/models"

	"gorm.io/gorm"
)

// InitDB 初始化数据库连接
func InitDB() {
	models.InitDB()
}

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return models.GetDB()
}
