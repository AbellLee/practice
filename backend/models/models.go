package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	
	"github.com/glebarez/sqlite"
)

// User 用户模型
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Email     string         `gorm:"size:100" json:"email"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Question 题目模型
type Question struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	Title      string         `gorm:"size:500;not null" json:"title"`
	Content    string         `gorm:"type:text" json:"content"`
	Type       string         `gorm:"size:20;not null" json:"type"` // "choice" 或 "judge"
	Options    string         `gorm:"type:text" json:"options"`     // JSON 存储选择题选项
	Answer     string         `gorm:"size:500;not null" json:"answer"`
	Analysis   string         `gorm:"type:text" json:"analysis"` // 答案解析
	Difficulty int            `gorm:"default:1" json:"difficulty"` // 1-5 难度
	Category   string         `gorm:"size:50" json:"category"`   // 分类
	Tags       string         `gorm:"size:200" json:"tags"`      // 标签，逗号分隔
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

// AnswerRecord 答题记录模型
type AnswerRecord struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	UserID     uint           `gorm:"not null" json:"user_id"`
	QuestionID uint           `gorm:"not null" json:"question_id"`
	UserAnswer string         `gorm:"size:500" json:"user_answer"`
	IsCorrect  bool           `json:"is_correct"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	
	User       User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Question   Question       `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

// UserStats 用户统计模型
type UserStats struct {
	ID              uint `gorm:"primaryKey" json:"id"`
	UserID          uint `gorm:"uniqueIndex;not null" json:"user_id"`
	TotalAnswered   int  `gorm:"default:0" json:"total_answered"`
	CorrectCount    int  `gorm:"default:0" json:"correct_count"`
	WrongCount      int  `gorm:"default:0" json:"wrong_count"`
	StreakDays      int  `gorm:"default:0" json:"streak_days"`         // 连续答题天数
	LastAnswerDate  string `gorm:"size:20" json:"last_answer_date"`   // 最后答题日期 YYYY-MM-DD
	TotalTimeSpent  int  `gorm:"default:0" json:"total_time_spent"`   // 总答题时间（秒）
	AvgResponseTime int  `gorm:"default:0" json:"avg_response_time"`  // 平均答题时间（秒）
	
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// Favorite 收藏模型
type Favorite struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	UserID     uint           `gorm:"not null;index" json:"user_id"`
	QuestionID uint           `gorm:"not null;index" json:"question_id"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	
	User     User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Question Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

// WrongBook 错题本模型
type WrongBook struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	QuestionID   uint           `gorm:"not null;index" json:"question_id"`
	WrongCount   int            `gorm:"default:1" json:"wrong_count"`  // 错误次数
	LastWrongAt  time.Time      `json:"last_wrong_at"`                 // 最后错误时间
	ReviewedAt   *time.Time     `json:"reviewed_at,omitempty"`         // 最后复习时间
	Mastered     bool           `gorm:"default:false" json:"mastered"` // 已掌握
	CreatedAt    time.Time      `json:"created_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	
	User     User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Question Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

// Achievement 成就模型
type Achievement struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null;index" json:"user_id"`
	Type        string         `gorm:"size:50;not null;uniqueIndex:idx_user_type" json:"type"` // 成就类型
	Name        string         `gorm:"size:100;not null" json:"name"`                          // 成就名称
	Description string         `gorm:"type:text" json:"description"`                            // 成就描述
	Icon        string         `gorm:"size:100" json:"icon"`                                   // 成就图标
	UnlockedAt  time.Time      `json:"unlocked_at"`                                             // 解锁时间
	CreatedAt   time.Time      `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// DailyPractice 每日练习模型
type DailyPractice struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	Date       string         `gorm:"size:20;not null;uniqueIndex:idx_date_question" json:"date"` // 日期 YYYY-MM-DD
	QuestionID uint           `gorm:"not null;uniqueIndex:idx_date_question" json:"question_id"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	
	Question Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

// AnswerRecordWithTime 答题记录（带时间）
type AnswerRecordWithTime struct {
	AnswerRecord
	ResponseTime int `gorm:"default:0" json:"response_time"` // 答题耗时（秒）
}

var DB *gorm.DB

// InitDB 初始化数据库连接
func InitDB() {
	var err error
	// 使用文件数据库
	DB, err = gorm.Open(sqlite.Open("practice.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		panic("failed to connect database")
	}

	// 自动迁移模型
	err = DB.AutoMigrate(
		&User{},
		&Question{},
		&AnswerRecord{},
		&UserStats{},
		&Favorite{},
		&WrongBook{},
		&Achievement{},
		&DailyPractice{},
	)
	if err != nil {
		panic("failed to migrate database")
	}

	// 创建默认管理员账户
	CreateDefaultAdmin()
	
	// 创建示例题目
	CreateSampleQuestions()
}

// CreateDefaultAdmin 创建默认管理员账户
func CreateDefaultAdmin() {
	var admin User
	result := DB.Where("username = ?", "admin").First(&admin)
	
	if result.Error != nil {
		// 用户不存在，创建默认管理员
		// 默认密码：admin123
		hashedPassword := "$2a$10$TKyvPDlTHDUH6qA/MUOI9u4Z6tYrmXbBgPK9vzqU6mok8q3X3je7a"
		admin = User{
			Username: "admin",
			Password: hashedPassword,
			Email:    "admin@example.com",
		}
		DB.Create(&admin)
	} else {
		// 用户已存在，强制更新为正确的密码哈希
		// 默认密码 admin123 的正确哈希
		correctHash := "$2a$10$TKyvPDlTHDUH6qA/MUOI9u4Z6tYrmXbBgPK9vzqU6mok8q3X3je7a"
		if admin.Password != correctHash {
			fmt.Printf("[DEBUG] 更新 admin 用户密码哈希\n")
			DB.Model(&admin).Update("password", correctHash)
		}
	}
}

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return DB
}

// CreateSampleQuestions 创建示例题目
func CreateSampleQuestions() {
	var count int64
	DB.Model(&Question{}).Count(&count)
	
	if count > 0 {
		return
	}
	
	questions := []Question{
		{
			Title:      "Go 语言基础 - 变量声明",
			Content:    "以下哪个是正确的 Go 语言变量声明方式？",
			Type:       "choice",
			Options:    `["var x int = 5", "int x = 5", "x : int = 5", "declare x int = 5"]`,
			Answer:     "A",
			Analysis:   "Go 语言使用 var 关键字声明变量，格式为 var 变量名 类型 = 值",
			Difficulty: 1,
			Category:   "Go 基础",
			Tags:       "变量，基础",
		},
		{
			Title:      "Go 语言 - 切片操作",
			Content:    "切片的长度可以使用哪个内置函数获取？",
			Type:       "choice",
			Options:    `["size()", "count()", "len()", "length()"]`,
			Answer:     "C",
			Analysis:   "Go 语言使用 len() 函数获取切片、数组、字符串等的长度",
			Difficulty: 1,
			Category:   "Go 基础",
			Tags:       "切片，基础",
		},
		{
			Title:      "Go 语言 - 错误处理",
			Content:    "Go 语言中，错误处理通常使用 if err != nil 的方式。",
			Type:       "judge",
			Options:    "[]",
			Answer:     "true",
			Analysis:   "Go 语言采用显式错误处理，通过检查 error 返回值来处理错误",
			Difficulty: 1,
			Category:   "Go 基础",
			Tags:       "错误处理",
		},
	}
	
	for _, q := range questions {
		DB.Create(&q)
	}
}
