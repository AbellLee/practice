package routes

import (
	"practice-system/controllers"
	"practice-system/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置所有路由
func SetupRoutes(r *gin.Engine) {
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
				questionsAuth.POST("/import-file", controllers.ImportQuestionsFromFile)
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
			
			// 每日练习
			practice.GET("/daily", controllers.GetDailyPractice)
			
			// 统计
			practice.GET("/statistics", controllers.GetStatistics)
		}
	}
}
