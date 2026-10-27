package com.musabbir.fintech.domain.model

enum class Currency {
    AED,
    INR
}

enum class TimePeriod {
    TODAY,
    YESTERDAY,
    THIS_WEEK,
    LAST_WEEK,
    THIS_MONTH,
    LAST_MONTH,
    THIS_YEAR,
    CUSTOM,
    ALL_TIME
}

enum class DebtType {
    DEBIT,  // Money I Owe
    CREDIT  // Money Owed to Me
}

enum class DebtStatus {
    ACTIVE,
    PARTIALLY_PAID,
    FULLY_PAID,
    OVERDUE,
    ARCHIVED
}

enum class PaymentMethod {
    CASH,
    CARD,
    BANK_TRANSFER,
    UPI,
    CHEQUE,
    OTHER
}

data class Category(
    val id: String,
    val name: String,
    val currency: Currency,
    val icon: String,
    val color: String,
    val description: String? = null,
    val monthlyBudgetMinor: Long? = null, // In minor units (fils / paise)
    val isCustom: Boolean = false,
    val isArchived: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

data class Income(
    val id: String,
    val date: String, // YYYY-MM-DD
    val amountMinor: Long, // fils or paise
    val currency: Currency,
    val source: String,
    val paymentMethod: PaymentMethod,
    val description: String? = null,
    val tags: List<String> = emptyList(),
    val createdAt: Long = System.currentTimeMillis()
)

data class Expense(
    val id: String,
    val date: String, // YYYY-MM-DD
    val amountMinor: Long, // fils or paise
    val categoryId: String,
    val currency: Currency,
    val merchant: String,
    val reason: String,
    val notes: String? = null,
    val paymentMethod: PaymentMethod,
    val tags: List<String> = emptyList(),
    val createdAt: Long = System.currentTimeMillis()
)

data class Debt(
    val id: String,
    val type: DebtType,
    val personName: String,
    val contactInfo: String? = null,
    val originalAmountMinor: Long,
    val currency: Currency,
    val startDate: String,
    val dueDate: String? = null,
    val reason: String,
    val notes: String? = null,
    val status: DebtStatus = DebtStatus.ACTIVE,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

data class Repayment(
    val id: String,
    val debtId: String,
    val date: String,
    val amountMinor: Long,
    val currency: Currency,
    val paymentMethod: PaymentMethod,
    val paymentSourceOrDest: String? = null,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

data class Reminder(
    val id: String,
    val title: String,
    val relatedDebtId: String? = null,
    val personOrOrg: String,
    val amountMinor: Long? = null,
    val currency: Currency,
    val dueDate: String,
    val reminderDateTime: String,
    val repeatSchedule: String = "NONE",
    val notes: String? = null,
    val isCompleted: Boolean = false
)

data class SavingsGoal(
    val id: String,
    val name: String,
    val currency: Currency,
    val targetAmountMinor: Long,
    val currentAmountMinor: Long,
    val targetDate: String,
    val notes: String? = null
)
