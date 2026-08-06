/* =========================================================================
   THE ALEXANDRA RICHMOND FOUNDATION — PAYMENT CONFIG
   =========================================================================
   This is the ONLY file you need to edit to turn on online giving.
   It powers BOTH the Donate page and the Events sponsorship checkout.

   TO GO LIVE:
     1. Create a free campaign at givebutter.com (Dashboard → Campaigns → New)
     2. Copy its public link, e.g. https://givebutter.com/alexandra-richmond
     3. Paste it into givebutterCampaign below.
     4. Save and re-deploy.

   Until that link is filled in, every Give / Sponsor / Ticket button stays
   visibly disabled and tells the visitor giving is not open yet. Nothing
   silently fails and no button ever takes money it cannot process.
   ========================================================================= */
window.ARF_PAYMENT = {

  /* ⬇⬇⬇  PASTE YOUR GIVEBUTTER CAMPAIGN LINK HERE  ⬇⬇⬇ */
  givebutterCampaign: '',   // e.g. 'https://givebutter.com/YOUR-CAMPAIGN'
  /* ⬆⬆⬆  that is the only required change  ⬆⬆⬆ */

  // Optional: a separate Givebutter campaign just for the Power of Purple event.
  // Leave empty to send sponsorships and tickets to the main campaign above.
  eventCampaign: '',

  // Alternative providers (only used if you switch provider on the donate page)
  donorboxUrl: '',
  stripePublishableKey: '',

  venmoHandle: '@AlexandraRichmondFdn'
};

/* -------------------------------------------------------------------------
   Shared helpers. Both pages use these so checkout behaves identically.
   ------------------------------------------------------------------------- */
window.ARF_CHECKOUT = {

  // Which campaign a given context should use.
  campaignFor(context){
    const c = window.ARF_PAYMENT || {};
    return (context === 'event' && c.eventCampaign) ? c.eventCampaign : (c.givebutterCampaign || '');
  },

  // Is checkout actually usable for this context?
  ready(context){
    return !!this.campaignFor(context);
  },

  /* Build a Givebutter hosted-checkout URL with the amount pre-filled.
     Givebutter's checkout is PCI-compliant and hosted on their domain, so no
     card data ever touches this site.
       opts: { amount, frequency:'once'|'monthly', note, context } */
  url(opts){
    opts = opts || {};
    const base = this.campaignFor(opts.context).replace(/\/+$/, '');
    if(!base) return '';
    const p = new URLSearchParams();
    if(opts.amount) p.set('amount', opts.amount);
    if(opts.frequency === 'monthly') p.set('frequency', 'recurring');
    // Givebutter surfaces this back to the Foundation on the transaction record,
    // which is how a gift gets attributed to a sponsorship tier or a ticket.
    if(opts.note) p.set('note', opts.note);
    const qs = p.toString();
    return qs ? base + (base.includes('?') ? '&' : '?') + qs : base;
  },

  // Send the visitor to checkout. Returns false if not configured.
  go(opts){
    const u = this.url(opts);
    if(!u){ console.warn('Givebutter campaign link not set — checkout unavailable.'); return false; }
    window.location.href = u;
    return true;
  }
};
