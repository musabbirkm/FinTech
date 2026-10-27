package com.musabbir.fintech.domain.calculations

import com.musabbir.fintech.domain.model.Currency
import com.musabbir.fintech.domain.model.Debt
import com.musabbir.fintech.domain.model.Repayment
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale

object FinancialCalculations {

    /**
     * Convert major units string or double to integer minor units (fils / paise).
     * Avoids IEEE floating point inaccuracies.
     */
    fun toMinorUnits(majorString: String, currency: Currency): Long {
        val clean = majorString.replace(",", "").trim()
        if (clean.isBlank()) return 0L

        val parts = clean.split(".")
        val whole = parts.getOrNull(0)?.toLongOrNull() ?: 0L
        val fracStr = (parts.getOrNull(1) ?: "").padEnd(2, '0').take(2)
        val frac = fracStr.toLongOrNull() ?: 0L

        val sign = if (clean.startsWith("-")) -1L else 1L
        val absWhole = kotlin.math.abs(whole)
        return sign * (absWhole * 100L + frac)
    }

    /**
     * Convert minor units to major units Double (for charts and exports).
     */
    fun toMajorUnits(minorUnits: Long): Double {
        return minorUnits / 100.0
    }

    /**
     * Format minor units into clean display string with currency symbol.
     */
    fun formatMoney(minorUnits: Long, currency: Currency, showSymbol: Boolean = true): String {
        val abs = kotlin.math.abs(minorUnits)
        val whole = abs / 100
        val frac = abs % 100
        val fracStr = String.format(Locale.US, "%02d", frac)

        val formattedWhole = if (currency == Currency.INR) {
            formatIndianNumber(whole)
        } else {
            val symbols = DecimalFormatSymbols(Locale.US)
            DecimalFormat("#,##0", symbols).format(whole)
        }

        val sign = if (minorUnits < 0) "-" else ""
        val numStr = "$sign$formattedWhole.$fracStr"

        if (!showSymbol) return numStr

        val symbol = when (currency) {
            Currency.AED -> "AED"
            Currency.INR -> "₹"
        }
        return "$symbol $numStr"
    }

    private fun formatIndianNumber(x: Long): String {
        val s = x.toString()
        if (s.length <= 3) return s
        val lastThree = s.substring(s.length - 3)
        val otherNumbers = s.substring(0, s.length - 3)
        val regex = Regex("\\B(?=(\\d{2})+(?!\\d))")
        val formattedOther = regex.replace(otherNumbers, ",")
        return "$formattedOther,$lastThree"
    }

    /**
     * Outstanding debt calculation: Original Principal - Sum(Repayments)
     * Strictly filters repayments by the debt's currency.
     */
    fun calculateOutstanding(debt: Debt, repayments: List<Repayment>): DebtCalculationResult {
        val validRepayments = repayments.filter { it.debtId == debt.id && it.currency == debt.currency }
        val repaidMinor = validRepayments.sumOf { it.amountMinor }
        val outstandingMinor = kotlin.math.max(0L, debt.originalAmountMinor - repaidMinor)
        val percent = if (debt.originalAmountMinor > 0L) {
            ((repaidMinor.toDouble() / debt.originalAmountMinor.toDouble()) * 100).toInt().coerceIn(0, 100)
        } else {
            100
        }

        return DebtCalculationResult(
            originalAmountMinor = debt.originalAmountMinor,
            repaidAmountMinor = repaidMinor,
            outstandingAmountMinor = outstandingMinor,
            percentRepaid = percent,
            isFullyPaid = outstandingMinor == 0L
        )
    }
}

data class DebtCalculationResult(
    val originalAmountMinor: Long,
    val repaidAmountMinor: Long,
    val outstandingAmountMinor: Long,
    val percentRepaid: Int,
    val isFullyPaid: Boolean
)
