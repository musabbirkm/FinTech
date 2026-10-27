package com.musabbir.fintech

import com.musabbir.fintech.domain.calculations.FinancialCalculations
import com.musabbir.fintech.domain.model.Currency
import com.musabbir.fintech.domain.model.Debt
import com.musabbir.fintech.domain.model.DebtStatus
import com.musabbir.fintech.domain.model.DebtType
import com.musabbir.fintech.domain.model.PaymentMethod
import com.musabbir.fintech.domain.model.Repayment
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FinancialCalculationsTest {

    @Test
    fun toMinorUnits_convertsAedCorrectly() {
        // 1000 AED = 100,000 fils
        val minor = FinancialCalculations.toMinorUnits("1000", Currency.AED)
        assertEquals(100000L, minor)

        val minorWithFils = FinancialCalculations.toMinorUnits("1250.50", Currency.AED)
        assertEquals(125050L, minorWithFils)
    }

    @Test
    fun toMinorUnits_convertsInrCorrectly() {
        // 10,000 INR = 1,000,000 paise
        val minor = FinancialCalculations.toMinorUnits("10000", Currency.INR)
        assertEquals(1000000L, minor)
    }

    @Test
    fun calculateOutstandingDebt_aed1000With300Repaid_returns700() {
        val debt = Debt(
            id = "d1",
            type = DebtType.DEBIT,
            personName = "Ahmed",
            originalAmountMinor = 100000L, // 1,000 AED
            currency = Currency.AED,
            startDate = "2026-10-01",
            reason = "Equipment"
        )

        val repayments = listOf(
            Repayment(
                id = "r1",
                debtId = "d1",
                date = "2026-10-10",
                amountMinor = 30000L, // 300 AED
                currency = Currency.AED,
                paymentMethod = PaymentMethod.BANK_TRANSFER
            )
        )

        val result = FinancialCalculations.calculateOutstanding(debt, repayments)
        assertEquals(30000L, result.repaidAmountMinor)
        assertEquals(70000L, result.outstandingAmountMinor) // Exactly 700 AED
        assertEquals(30, result.percentRepaid)
        assertFalse(result.isFullyPaid)
    }

    @Test
    fun calculateOutstanding_strictlyIgnoresCrossCurrencyRepayments() {
        val debt = Debt(
            id = "d-aed",
            type = DebtType.DEBIT,
            personName = "Khalid",
            originalAmountMinor = 50000L, // 500 AED
            currency = Currency.AED,
            startDate = "2026-10-01",
            reason = "Tooling"
        )

        // Attempting to pass INR repayment for AED debt
        val repayments = listOf(
            Repayment(
                id = "r-inr",
                debtId = "d-aed",
                date = "2026-10-10",
                amountMinor = 20000L,
                currency = Currency.INR,
                paymentMethod = PaymentMethod.UPI
            )
        )

        val result = FinancialCalculations.calculateOutstanding(debt, repayments)
        assertEquals(0L, result.repaidAmountMinor)
        assertEquals(50000L, result.outstandingAmountMinor)
    }
}
