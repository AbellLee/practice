package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"practice-system/models"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// GetQuestions 获取题目列表（支持筛选和分页）
func GetQuestions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	category := c.Query("category")
	difficulty := c.Query("difficulty")
	tags := c.Query("tags")
	questionType := c.Query("type")

	offset := (page - 1) * pageSize

	query := models.GetDB().Model(&models.Question{})

	// 筛选条�?
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if tags != "" {
		query = query.Where("tags LIKE ?", "%"+tags+"%")
	}
	if questionType != "" {
		query = query.Where("type = ?", questionType)
	}

	var total int64
	query.Count(&total)

	var questions []models.Question
	if err := query.Order("id DESC").Offset(offset).Limit(pageSize).Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取题目失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"list":     questions,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
		},
	})
}

// GetQuestion 获取单个题目详情
func GetQuestion(c *gin.Context) {
	id := c.Param("id")

	var question models.Question
	if err := models.GetDB().First(&question, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "题目不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": question,
	})
}

// CreateQuestion 创建题目
func CreateQuestion(c *gin.Context) {
	var req struct {
		Title      string   `json:"title" binding:"required"`
		Content    string   `json:"content"`
		Type       string   `json:"type" binding:"required,oneof=choice judge"`
		Options    []string `json:"options"`
		Answer     string   `json:"answer" binding:"required"`
		Analysis   string   `json:"analysis"`
		Difficulty int      `json:"difficulty" binding:"required,min=1,max=5"`
		Category   string   `json:"category"`
		Tags       []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// 转换选项�?JSON 字符�?
	var optionsJSON string
	if len(req.Options) > 0 {
		optionsBytes, _ := json.Marshal(req.Options)
		optionsJSON = string(optionsBytes)
	}

	// 转换标签为逗号分隔字符�?
	tagsStr := strings.Join(req.Tags, ",")

	question := models.Question{
		Title:      req.Title,
		Content:    req.Content,
		Type:       req.Type,
		Options:    optionsJSON,
		Answer:     req.Answer,
		Analysis:   req.Analysis,
		Difficulty: req.Difficulty,
		Category:   req.Category,
		Tags:       tagsStr,
	}

	if err := models.GetDB().Create(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "创建题目失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "创建成功",
		"data": question,
	})
}

// UpdateQuestion 更新题目
func UpdateQuestion(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Title      string   `json:"title"`
		Content    string   `json:"content"`
		Type       string   `json:"type"`
		Options    []string `json:"options"`
		Answer     string   `json:"answer"`
		Analysis   string   `json:"analysis"`
		Difficulty int      `json:"difficulty"`
		Category   string   `json:"category"`
		Tags       []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var question models.Question
	if err := models.GetDB().First(&question, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "题目不存在",
		})
		return
	}

	// 更新字段
	if req.Title != "" {
		question.Title = req.Title
	}
	if req.Content != "" {
		question.Content = req.Content
	}
	if req.Type != "" {
		question.Type = req.Type
	}
	if req.Options != nil {
		optionsBytes, _ := json.Marshal(req.Options)
		question.Options = string(optionsBytes)
	}
	if req.Answer != "" {
		question.Answer = req.Answer
	}
	if req.Analysis != "" {
		question.Analysis = req.Analysis
	}
	if req.Difficulty >= 1 && req.Difficulty <= 5 {
		question.Difficulty = req.Difficulty
	}
	if req.Category != "" {
		question.Category = req.Category
	}
	if req.Tags != nil {
		question.Tags = strings.Join(req.Tags, ",")
	}

	if err := models.GetDB().Save(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "更新题目失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "更新成功",
		"data": question,
	})
}

// DeleteQuestion 删除题目
func DeleteQuestion(c *gin.Context) {
	id := c.Param("id")

	if err := models.GetDB().Delete(&models.Question{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "删除题目失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "删除成功",
	})
}

// GetCategories 获取所有分�?
func GetCategories(c *gin.Context) {
	var categories []string
	models.GetDB().Model(&models.Question{}).Distinct("category").Pluck("category", &categories)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": categories,
	})
}

// GetTags 获取所有标�?
func GetTags(c *gin.Context) {
	var tags []models.Question
	models.GetDB().Find(&tags)

	tagMap := make(map[string]bool)
	for _, q := range tags {
		if q.Tags != "" {
			tagList := strings.Split(q.Tags, ",")
			for _, tag := range tagList {
				tagMap[tag] = true
			}
		}
	}

	var tagList []string
	for tag := range tagMap {
		tagList = append(tagList, tag)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": tagList,
	})
}

// ImportQuestions 批量导入题目
func ImportQuestions(c *gin.Context) {
	var req struct {
		Questions []struct {
			Title      string   `json:"title" binding:"required"`
			Content    string   `json:"content"`
			Type       string   `json:"type" binding:"required,oneof=choice judge"`
			Options    []string `json:"options"`
			Answer     string   `json:"answer" binding:"required"`
			Analysis   string   `json:"analysis"`
			Difficulty int      `json:"difficulty" binding:"required,min=1,max=5"`
			Category   string   `json:"category"`
			Tags       []string `json:"tags"`
		} `json:"questions" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": fmt.Sprintf("数据格式错误: %s", err.Error()),
		})
		return
	}

	imported := 0
	skipped := 0
	errors := []string{}

	for i, q := range req.Questions {
		// 去重检查
		var existing models.Question
		if err := models.GetDB().Where("title = ?", q.Title).First(&existing).Error; err == nil {
			skipped++
			continue
		}

		var optionsJSON string
		if len(q.Options) > 0 {
			optionsBytes, _ := json.Marshal(q.Options)
			optionsJSON = string(optionsBytes)
		}

		question := models.Question{
			Title:      q.Title,
			Content:    q.Content,
			Type:       q.Type,
			Options:    optionsJSON,
			Answer:     q.Answer,
			Analysis:   q.Analysis,
			Difficulty: q.Difficulty,
			Category:   q.Category,
			Tags:       strings.Join(q.Tags, ","),
		}

		if err := models.GetDB().Create(&question).Error; err != nil {
			errors = append(errors, fmt.Sprintf("第 %d 题导入失败: %s", i+1, err.Error()))
			continue
		}
		imported++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("导入完成：成功 %d 题，跳过 %d 题（已存在），失败 %d 题", imported, skipped, len(errors)),
		"data": gin.H{
			"imported": imported,
			"skipped":  skipped,
			"failed":   len(errors),
			"errors":   errors,
		},
	})
}

// ImportQuestionsFromFile 从 JSON 文件导入题目
func ImportQuestionsFromFile(c *gin.Context) {
	var req struct {
		FilePath string `json:"file_path" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "请提供文件路径 file_path",
		})
		return
	}

	data, err := os.ReadFile(req.FilePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": fmt.Sprintf("读取文件失败: %s", err.Error()),
		})
		return
	}

	var questions []struct {
		Title      string   `json:"title"`
		Content    string   `json:"content"`
		Type       string   `json:"type"`
		Options    []string `json:"options"`
		Answer     string   `json:"answer"`
		Analysis   string   `json:"analysis"`
		Difficulty int      `json:"difficulty"`
		Category   string   `json:"category"`
		Tags       []string `json:"tags"`
	}

	if err := json.Unmarshal(data, &questions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": fmt.Sprintf("JSON 解析失败: %s", err.Error()),
		})
		return
	}

	imported := 0
	skipped := 0
	errors := []string{}

	for i, q := range questions {
		if q.Title == "" || q.Type == "" || q.Answer == "" || q.Difficulty < 1 || q.Difficulty > 5 {
			errors = append(errors, fmt.Sprintf("第 %d 题数据不完整，跳过", i+1))
			continue
		}
		if q.Type != "choice" && q.Type != "judge" {
			errors = append(errors, fmt.Sprintf("第 %d 题题型无效: %s", i+1, q.Type))
			continue
		}

		var existing models.Question
		if err := models.GetDB().Where("title = ?", q.Title).First(&existing).Error; err == nil {
			skipped++
			continue
		}

		var optionsJSON string
		if len(q.Options) > 0 {
			optionsBytes, _ := json.Marshal(q.Options)
			optionsJSON = string(optionsBytes)
		}

		question := models.Question{
			Title:      q.Title,
			Content:    q.Content,
			Type:       q.Type,
			Options:    optionsJSON,
			Answer:     q.Answer,
			Analysis:   q.Analysis,
			Difficulty: q.Difficulty,
			Category:   q.Category,
			Tags:       strings.Join(q.Tags, ","),
		}

		if err := models.GetDB().Create(&question).Error; err != nil {
			errors = append(errors, fmt.Sprintf("第 %d 题导入失败: %s", i+1, err.Error()))
			continue
		}
		imported++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("文件导入完成：成功 %d 题，跳过 %d 题（已存在），失败 %d 题", imported, skipped, len(errors)),
		"data": gin.H{
			"imported": imported,
			"skipped":  skipped,
			"failed":   len(errors),
			"errors":   errors,
		},
	})
}
