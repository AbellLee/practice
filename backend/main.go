package main

import (
	"net/http"
	"os"
	"path/filepath"
	"practice-system/controllers"
	"practice-system/middleware"
	"practice-system/models"
	"strings"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化数据库
	models.InitDB()

	// 创建 Gin 引擎
	r := gin.Default()

	// 配置 CORS
	r.Use(middleware.CORSMiddleware())

	// 设置路由
	setupRoutes(r)

	// 设置前端静态文件服务
	setupFrontend(r)

	// 启动服务器（监听所有网络接口，支持局域网访问）
	r.Run("0.0.0.0:8080")
}

// setupFrontend 配置前端静态文件服务
func setupFrontend(r *gin.Engine) {
	// 获取可执行文件所在目录
	execDir, _ := os.Getwd()
	distPath := filepath.Join(execDir, "dist")

	// 检查 dist 目录是否存在
	if _, err := os.Stat(distPath); os.IsNotExist(err) {
		gin.DefaultWriter.Write([]byte("[WARNING] dist directory not found, frontend will not be served\n"))
		return
	}

	// 服务静态文件（JS/CSS/图片等）
	r.Use(func(c *gin.Context) {
		path := c.Request.URL.Path

		// 跳过 API 路由
		if strings.HasPrefix(path, "/api") {
			c.Next()
			return
		}

		// 尝试提供静态文件
		filePath := filepath.Join(distPath, filepath.Clean(path))
		// 防止路径遍历攻击
		if !strings.HasPrefix(filePath, distPath) {
			c.Next()
			return
		}
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			http.ServeFile(c.Writer, c.Request, filePath)
			c.Abort()
			return
		}

		// SPA 回退：所有非文件请求返回 index.html
		indexPath := filepath.Join(distPath, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			http.ServeFile(c.Writer, c.Request, indexPath)
			c.Abort()
			return
		}

		c.Next()
	})
}

// setupRoutes 设置所有路由
func setupRoutes(r *gin.Engine) {
	// API 路由组
	api := r.Group("/api")
	{
		// 认证路由
		auth := api.Group("/auth")
		{
			// auth.POST("/register", controllers.Register) // 注册功能已禁用
			auth.POST("/login", controllers.Login)
			
			// 需要认证的路由
			authAuth := auth.Group("")
			authAuth.Use(middleware.JWTMiddleware())
			{
				authAuth.GET("/me", controllers.GetCurrentUser)
				authAuth.GET("/stats", controllers.GetUserStats)
				authAuth.POST("/change-password", controllers.ChangePassword)
			}
		}

		// 题目路由
		questions := api.Group("/questions")
		{
			questions.GET("", controllers.GetQuestions)
			questions.GET("/categories", controllers.GetCategories)
			questions.GET("/tags", controllers.GetTags)
			questions.GET("/:id", controllers.GetQuestion)
			
			// 需要认证的路由
			questionsAuth := questions.Group("")
			questionsAuth.Use(middleware.JWTMiddleware())
			{
				questionsAuth.POST("", controllers.CreateQuestion)
				questionsAuth.POST("/import", controllers.ImportQuestions)
				questionsAuth.PUT("/:id", controllers.UpdateQuestion)
				questionsAuth.DELETE("/:id", controllers.DeleteQuestion)
			}
		}

		// 答题路由
		answers := api.Group("/answers")
		answers.Use(middleware.JWTMiddleware())
		{
			answers.POST("/submit", controllers.SubmitAnswer)
			answers.GET("/records", controllers.GetAnswerRecords)
			answers.GET("/wrong", controllers.GetWrongQuestions)
		}

		// 练习功能路由
		practice := api.Group("/practice")
		practice.Use(middleware.JWTMiddleware())
		{
			// 收藏
			practice.GET("/favorites", controllers.GetFavorites)
			practice.POST("/favorites", controllers.AddFavorite)
			practice.DELETE("/favorites/:id", controllers.RemoveFavorite)
			
			// 错题本
			practice.GET("/wrong-book", controllers.GetWrongBook)
			practice.POST("/wrong-book/:id/review", controllers.MarkWrongBookReviewed)
			
			// 练习题目（支持排除已掌握）
			practice.GET("/questions", controllers.GetPracticeQuestions)

			// 每日练习
			practice.GET("/daily", controllers.GetDailyPractice)
			
			// 统计
			practice.GET("/statistics", controllers.GetStatistics)
		}
	}
}
