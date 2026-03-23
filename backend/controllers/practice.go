package controllers

import (
	"net/http"
	"practice-system/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetPracticeQuestions 获取练习题目（支持排除已掌握的题目）
// 掌握标准：连续正确回答3次及以上
func GetPracticeQuestions(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "用户未认证",
		})
		return
	}
	userID := userIDVal.(uint)

	category := c.Query("category")
	difficulty := c.Query("difficulty")
	questionType := c.Query("type")
	excludeMastered := c.DefaultQuery("exclude_mastered", "false")

	query := models.GetDB().Model(&models.Question{})

	if category != "" {
		query = query.Where("category = ?", category)
	}
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if questionType != "" {
		query = query.Where("type = ?", questionType)
	}

	// 排除已掌握的题目
	if excludeMastered == "true" {
		// 找出连续答对3次以上的题目ID
		var masteredIDs []uint
		rows, err := models.GetDB().Raw(`
			SELECT question_id FROM (
				SELECT question_id,
					(SELECT COUNT(*) FROM answer_records ar2 
					 WHERE ar2.user_id = ? AND ar2.question_id = answer_records.question_id
					 AND ar2.deleted_at IS NULL
					 AND ar2.id >= (
						SELECT COALESCE(MAX(ar3.id), 0) FROM answer_records ar3 
						WHERE ar3.user_id = ? AND ar3.question_id = answer_records.question_id 
						AND ar3.is_correct = 0 AND ar3.deleted_at IS NULL
					 )
					 AND ar2.is_correct = 1
					) as consecutive_correct
				FROM answer_records
				WHERE user_id = ? AND deleted_at IS NULL
				GROUP BY question_id
			) t WHERE consecutive_correct >= 3
		`, userID, userID, userID).Rows()

		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id uint
				rows.Scan(&id)
				masteredIDs = append(masteredIDs, id)
			}
		}

		// 也排除错题本中标记为已掌握的题目
		var wrongBookMasteredIDs []uint
		models.GetDB().Model(&models.WrongBook{}).
			Where("user_id = ? AND mastered = ?", userID, true).
			Pluck("question_id", &wrongBookMasteredIDs)
		masteredIDs = append(masteredIDs, wrongBookMasteredIDs...)

		if len(masteredIDs) > 0 {
			query = query.Where("id NOT IN ?", masteredIDs)
		}
	}

	var questions []models.Question
	if err := query.Order("id ASC").Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取题目失败",
		})
		return
	}

	// 统计掌握信息
	var totalCount int64
	countQuery := models.GetDB().Model(&models.Question{})
	if category != "" {
		countQuery = countQuery.Where("category = ?", category)
	}
	if difficulty != "" {
		countQuery = countQuery.Where("difficulty = ?", difficulty)
	}
	if questionType != "" {
		countQuery = countQuery.Where("type = ?", questionType)
	}
	countQuery.Count(&totalCount)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"list":          questions,
			"total":         totalCount,
			"available":     len(questions),
		},
	})
}

// GetFavorites 获取收藏列表
func GetFavorites(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "用户未认证",
		})
		return
	}
	userID := userIDVal.(uint)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	offset := (page - 1) * pageSize

	var total int64
	models.GetDB().Model(&models.Favorite{}).Where("user_id = ?", userID).Count(&total)

	var favorites []models.Favorite
	models.GetDB().Where("user_id = ?", userID).Preload("Question").
		Order("id DESC").Offset(offset).Limit(pageSize).Find(&favorites)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"list":     favorites,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

// AddFavorite 添加收藏
func AddFavorite(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "用户未认证",
		})
		return
	}
	userID := userIDVal.(uint)

	var req struct {
		QuestionID uint `json:"question_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 检查题目是否存在
	var question models.Question
	if err := models.GetDB().First(&question, req.QuestionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "题目不存在",
		})
		return
	}

	// 检查是否已收藏
	var favorite models.Favorite
	if err := models.GetDB().Where("user_id = ? AND question_id = ?", userID, req.QuestionID).First(&favorite).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "已收藏",
		})
		return
	}

	favorite = models.Favorite{
		UserID:     userID,
		QuestionID: req.QuestionID,
	}

	if err := models.GetDB().Create(&favorite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "收藏失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "收藏成功",
	})
}

// RemoveFavorite 取消收藏
func RemoveFavorite(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "用户未认证",
		})
		return
	}
	userID := userIDVal.(uint)

	questionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := models.GetDB().Where("user_id = ? AND question_id = ?", userID, questionID).Delete(&models.Favorite{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "取消收藏失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "取消收藏成功",
	})
}

// GetWrongBook 获取错题本
func GetWrongBook(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "用户未认证",
		})
		return
	}
	userID := userIDVal.(uint)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	offset := (page - 1) * pageSize

	mastered := c.Query("mastered")

	query := models.GetDB().Model(&models.WrongBook{}).Where("user_id = ?", userID)
	if mastered == "true" {
		query = query.Where("mastered = ?", true)
	} else if mastered == "false" {
		query = query.Where("mastered = ?", false)
	}

	var total int64
	query.Count(&total)

	var wrongBooks []models.WrongBook
	query.Preload("Question").Order("last_wrong_at DESC").Offset(offset).Limit(pageSize).Find(&wrongBooks)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"list":     wrongBooks,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

// MarkWrongBookReviewed 标记错题已复习
func MarkWrongBookReviewed(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "用户未认证",
		})
		return
	}
	userID := userIDVal.(uint)

	questionID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var wrongBook models.WrongBook
	if err := models.GetDB().Where("user_id = ? AND question_id = ?", userID, questionID).First(&wrongBook).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "错题记录不存在",
		})
		return
	}

	now := time.Now()
	wrongBook.ReviewedAt = &now
	wrongBook.Mastered = true
	models.GetDB().Save(&wrongBook)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "标记成功",
	})
}

// GetDailyPractice 获取每日练习
func GetDailyPractice(c *gin.Context) {
	today := time.Now().Format("2006-01-02")

	var dailyPractice models.DailyPractice
	if err := models.GetDB().Where("date = ?", today).Preload("Question").First(&dailyPractice).Error; err != nil {
		// 今日题目不存在，随机选择一道题目
		var questions []models.Question
		models.GetDB().Order("RANDOM()").Limit(1).Find(&questions)
		
		if len(questions) == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "没有可用的题目",
			})
			return
		}

		dailyPractice = models.DailyPractice{
			Date:       today,
			QuestionID: questions[0].ID,
		}
		models.GetDB().Create(&dailyPractice)
		
		dailyPractice.Question = questions[0]
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": dailyPractice,
	})
}

// GetStatistics 获取详细统计
func GetStatistics(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "用户未认证",
		})
		return
	}
	userID := userIDVal.(uint)

	var stats models.UserStats
	if err := models.GetDB().Where("user_id = ?", userID).First(&stats).Error; err != nil {
		stats = models.UserStats{
			UserID: userID,
		}
	}

	// 获取答题趋势（最近 7 天）
	type DailyStats struct {
		Date  string
		Count int64
	}
	var dailyStats []DailyStats
	models.GetDB().Table("answer_records").
		Select("DATE(created_at) as date, COUNT(*) as count").
		Where("user_id = ?", userID).
		Group("DATE(created_at)").
		Order("date DESC").
		Limit(7).
		Scan(&dailyStats)

	// 获取分类统计
	type CategoryStats struct {
		Category string
		Count    int64
		Correct  int64
	}
	var categoryStats []CategoryStats
	models.GetDB().Table("answer_records ar").
		Select("q.category, COUNT(*) as count, SUM(CASE WHEN ar.is_correct = 1 THEN 1 ELSE 0 END) as correct").
		Joins("JOIN questions q ON ar.question_id = q.id").
		Where("ar.user_id = ? AND ar.deleted_at IS NULL", userID).
		Group("q.category").
		Scan(&categoryStats)

	// 获取收藏数量
	var favoriteCount int64
	models.GetDB().Model(&models.Favorite{}).Where("user_id = ?", userID).Count(&favoriteCount)

	// 获取错题数量
	var wrongCount int64
	models.GetDB().Model(&models.WrongBook{}).Where("user_id = ? AND mastered = ?", userID, false).Count(&wrongCount)

	// 获取成就数量
	var achievementCount int64
	models.GetDB().Model(&models.Achievement{}).Where("user_id = ?", userID).Count(&achievementCount)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"stats":           stats,
			"daily_stats":     dailyStats,
			"category_stats":  categoryStats,
			"favorite_count":  favoriteCount,
			"wrong_count":     wrongCount,
			"achievement_count": achievementCount,
		},
	})
}
