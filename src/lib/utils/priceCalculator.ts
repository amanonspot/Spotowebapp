/**
 * Price Calculation Utilities
 * Centralized logic for calculating prices from event data
 */

export const getPricePerNight = (event: any): number => {
    console.log('🔍 Event data for pricing:', event);
    console.log('🔍 Event lowest price:', event?.event_lowest_price);
    console.log('🔍 Event phases_tickets:', event?.phases_tickets);
    
    // Check for event_lowest_price first (from API response)
    if (event?.event_lowest_price && event.event_lowest_price > 0) {
        console.log('✅ Using event_lowest_price:', event.event_lowest_price);
        return event.event_lowest_price;
    }

    // Check phases_tickets (from API response) for price_per_day (for stays) or price_per_ticket (for events)
    if (event?.phases_tickets && event.phases_tickets.length > 0) {
        const allTickets = event.phases_tickets.flatMap((phase: any) => phase.ticket || []);
        console.log('🔍 All tickets from phases_tickets:', allTickets);
        
        if (allTickets.length > 0) {
            // For stay events, check price_per_day first
            const dayPrices = allTickets
                .map((t: any) => t.price_per_day)
                .filter((p: any): p is number => p !== null && p !== undefined && p > 0);
            
            if (dayPrices.length > 0) {
                const minPrice = Math.min(...dayPrices);
                console.log('✅ Using min price_per_day from phases_tickets:', minPrice);
                return minPrice;
            }

            // For event tickets, check price_per_ticket
            const ticketPrices = allTickets
                .map((t: any) => t.price_per_ticket)
                .filter((p: any): p is number => p !== null && p !== undefined && p > 0);
            
            if (ticketPrices.length > 0) {
                const minPrice = Math.min(...ticketPrices);
                console.log('✅ Using min price_per_ticket from phases_tickets:', minPrice);
                return minPrice;
            }
        }
    }

    // Legacy format: Check phases array
    if (event?.phases && event.phases.length > 0) {
        const allTickets = event.phases.flatMap((phase: any) => phase.tickets);
        const prices = allTickets.map((t: any) => t.price_per_ticket).filter((p: any) => p > 0);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            console.log('✅ Using min price from legacy phases:', minPrice);
            return minPrice;
        }
    }

    // Default fallback
    console.log('⚠️ No price found, returning default 0');
    return 0;
};

