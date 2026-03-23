package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Question struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	Title      string         `gorm:"size:500;not null" json:"title"`
	Content    string         `gorm:"type:text" json:"content"`
	Type       string         `gorm:"size:20;not null" json:"type"`
	Options    string         `gorm:"type:text" json:"options"`
	Answer     string         `gorm:"size:500;not null" json:"answer"`
	Analysis   string         `gorm:"type:text" json:"analysis"`
	Difficulty int            `gorm:"default:1" json:"difficulty"`
	Category   string         `gorm:"size:50" json:"category"`
	Tags       string         `gorm:"size:200" json:"tags"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type ImportQuestion struct {
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

func main() {
	if len(os.Args) < 2 {
		fmt.Println("用法: go run import_tool.go <json文件路径>")
		fmt.Println("示例: go run import_tool.go import_questions.json")
		os.Exit(1)
	}

	filePath := os.Args[1]
	data, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("读取文件失败: %s\n", err)
		os.Exit(1)
	}

	var questions []ImportQuestion
	if err := json.Unmarshal(data, &questions); err != nil {
		fmt.Printf("JSON 解析失败: %s\n", err)
		os.Exit(1)
	}

	db, err := gorm.Open(sqlite.Open("practice.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		fmt.Printf("数据库连接失败: %s\n", err)
		os.Exit(1)
	}

	imported := 0
	skipped := 0

	for _, q := range questions {
		var existing Question
		if err := db.Where("title = ?", q.Title).First(&existing).Error; err == nil {
			skipped++
			continue
		}

		var optionsJSON string
		if len(q.Options) > 0 {
			optionsBytes, _ := json.Marshal(q.Options)
			optionsJSON = string(optionsBytes)
		}

		question := Question{
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

		if err := db.Create(&question).Error; err != nil {
			fmt.Printf("导入失败 [%s]: %s\n", q.Title, err)
			continue
		}
		imported++
	}

	fmt.Printf("导入完成：成功 %d 题，跳过 %d 题（已存在）\n", imported, skipped)
}
