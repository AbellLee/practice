package controllers

import (
	"net/http"
	"practice-system/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// SubmitAnswer 提交答案
func SubmitAnswer(c *gin.Context) {
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
		QuestionID   uint   `json:"question_id" binding:"required"`
		UserAnswer   string `json:"user_answer" binding:"required"`
		ResponseTime int    `json:"response_time"` // 答题时间（秒）
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 获取题目
	var question models.Question
	if err := models.GetDB().First(&question, req.QuestionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "题目不存在",
		})
		return
	}

	// 判断答案是否正确
	isCorrect := false
	if question.Type == "choice" {
		isCorrect = (req.UserAnswer == question.Answer)
	} else if question.Type == "judge" {
		// 判断题支持多种答案格式
		isCorrect = (req.UserAnswer == question.Answer || 
			(req.UserAnswer == "true" && question.Answer == "正确") ||
			(req.UserAnswer == "false" && question.Answer == "错误"))
	}

	// 创建答题记录
	record := models.AnswerRecord{
		UserID:     userID,
		QuestionID: req.QuestionID,
		UserAnswer: req.UserAnswer,
		IsCorrect:  isCorrect,
	}

	if err := models.GetDB().Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "提交答案失败",
		})
		return
	}

	// 更新用户统计（如果不存在则创建）
	var stats models.UserStats
	if err := models.GetDB().Where("user_id = ?", userID).First(&stats).Error; err != nil {
		stats = models.UserStats{
			UserID: userID,
		}
		models.GetDB().Create(&stats)
	}
	{
		stats.TotalAnswered++
		if isCorrect {
			stats.CorrectCount++
		} else {
			stats.WrongCount++
		}
		
		// 更新答题时间统计
		if req.ResponseTime > 0 {
			stats.TotalTimeSpent += req.ResponseTime
			// 计算平均答题时间
			if stats.TotalAnswered > 0 {
				stats.AvgResponseTime = stats.TotalTimeSpent / stats.TotalAnswered
			}
		}
		
		// 更新连续答题天数
		today := time.Now().Format("2006-01-02")
		if stats.LastAnswerDate != today {
			yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
			if stats.LastAnswerDate == yesterday {
				stats.StreakDays++
			} else if stats.LastAnswerDate != today {
				stats.StreakDays = 1
			}
			stats.LastAnswerDate = today
		}
		
		models.GetDB().Save(&stats)
	}

	// 如果答错了，加入错题本
	if !isCorrect {
		var wrongBook models.WrongBook
		err := models.GetDB().Where("user_id = ? AND question_id = ?", userID, req.QuestionID).First(&wrongBook).Error
		if err != nil {
			// 错题本中没有这道题，创建新记录
			wrongBook = models.WrongBook{
				UserID:      userID,
				QuestionID:  req.QuestionID,
				WrongCount:  1,
				LastWrongAt: time.Now(),
			}
			models.GetDB().Create(&wrongBook)
		} else {
			// 已存在，增加错误次数
			wrongBook.WrongCount++
			wrongBook.LastWrongAt = time.Now()
			wrongBook.Mastered = false
			models.GetDB().Save(&wrongBook)
		}
	}

	// 检查并解锁成就
	unlockAchievements(c, userID, stats)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "提交成功",
		"data": gin.H{
			"is_correct": isCorrect,
			"correct_answer": question.Answer,
			"analysis": question.Analysis,
			"streak_days": stats.StreakDays,
		},
	})
}

// GetAnswerRecords 获取答题记录
func GetAnswerRecords(c *gin.Context) {
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
	isCorrect := c.Query("is_correct")

	offset := (page - 1) * pageSize

	query := models.GetDB().Model(&models.AnswerRecord{}).Where("user_id = ?", userID)

	if isCorrect != "" {
		query = query.Where("is_correct = ?", isCorrect == "true")
	}

	var total int64
	query.Count(&total)

	var records []models.AnswerRecord
	if err := query.Preload("Question").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取记录失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"list":     records,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

// GetWrongQuestions 获取错题本
func GetWrongQuestions(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "用户未认证",
		})
		return
	}
	userID := userIDVal.(uint)

	var records []models.AnswerRecord
	if err := models.GetDB().Where("user_id = ? AND is_correct = ?", userID, false).
		Preload("Question").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取错题失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": records,
	})
}

// unlockAchievements 检查并解锁成就
func unlockAchievements(c *gin.Context, userID uint, stats models.UserStats) {
	achievements := []struct {
		Type        string
		Name        string
		Description string
		Icon        string
		Condition   func(models.UserStats) bool
	}{
		{
			Type:        "first_answer",
			Name:        "初次尝试",
			Description: "完成第一次答题",
			Icon:        "🎯",
			Condition: func(s models.UserStats) bool {
				return s.TotalAnswered >= 1
			},
		},
		{
			Type:        "ten_answers",
			Name:        "渐入佳境",
			Description: "累计答题 10 道",
			Icon:        "📚",
			Condition: func(s models.UserStats) bool {
				return s.TotalAnswered >= 10
			},
		},
		{
			Type:        "hundred_answers",
			Name:        "百题斩",
			Description: "累计答题 100 道",
			Icon:        "🏆",
			Condition: func(s models.UserStats) bool {
				return s.TotalAnswered >= 100
			},
		},
		{
			Type:        "perfect_start",
			Name:        "开门红",
			Description: "正确率达到 100%（至少答 10 题）",
			Icon:        "💯",
			Condition: func(s models.UserStats) bool {
				return s.TotalAnswered >= 10 && s.CorrectCount == s.TotalAnswered
			},
		},
		{
			Type:        "streak_3",
			Name:        "持之以恒",
			Description: "连续答题 3 天",
			Icon:        "🔥",
			Condition: func(s models.UserStats) bool {
				return s.StreakDays >= 3
			},
		},
		{
			Type:        "streak_7",
			Name:        "一周挑战",
			Description: "连续答题 7 天",
			Icon:        "⭐",
			Condition: func(s models.UserStats) bool {
				return s.StreakDays >= 7
			},
		},
		{
			Type:        "streak_30",
			Name:        "月度达人",
			Description: "连续答题 30 天",
			Icon:        "👑",
			Condition: func(s models.UserStats) bool {
				return s.StreakDays >= 30
			},
		},
	}

	for _, achievement := range achievements {
		// 检查是否已解锁
		var existing models.Achievement
		err := models.GetDB().Where("user_id = ? AND type = ?", userID, achievement.Type).First(&existing).Error
		if err == nil {
			// 已解锁，跳过
			continue
		}

		// 检查是否满足条件
		if achievement.Condition(stats) {
			// 解锁成就
			newAchievement := models.Achievement{
				UserID:      userID,
				Type:        achievement.Type,
				Name:        achievement.Name,
				Description: achievement.Description,
				Icon:        achievement.Icon,
				UnlockedAt:  time.Now(),
			}
			models.GetDB().Create(&newAchievement)
			
			// 发送通知（可以通过 WebSocket 或其他方式）
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "解锁新成就：" + achievement.Name,
				"achievement": newAchievement,
			})
		}
	}
}
