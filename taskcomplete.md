# DawaKhana Web - Pending Tasks

Maine project ka initial audit kiya. Frontend ka basic structure ready hai, lekin production launch se pehle neeche diye gaye kaam complete karne hain.

## 1. App ko runnable banana

- [x] `node_modules` install karna.
- [x] `npm install` run karna.
- [x] `npm run lint` successfully pass karwana. Lint exits successfully; existing non-blocking warnings remain.
- [x] `npm run build` successfully pass karwana. Production build completed successfully; a multiple-lockfile workspace warning remains.
- [x] Build ke baad deployment configuration verify karna. Netlify build command `npm run build` aur Next.js publish directory `.next` configured hain; production environment variables ko Netlify dashboard mein configure karna baki hai.

## 2. Checkout ko secure backend se connect karna

Current checkout page directly order create karta hai, jabki backend mein checkout API available hai.

- [x] Checkout ko `/api/v1/orders/checkout` ke through process karna. Frontend ab authenticated checkout API ko call karta hai aur server-returned order ID/total use karta hai.
- [x] Product prices server par validate karna. Checkout catalog se server-side `base_price` read karta hai, invalid prices reject karta hai, aur client-provided prices use nahi karta.
- [x] Stock server par validate karna. Checkout requested quantities ko valid integer quantities ke roop mein validate karta hai aur non-expired batch stock ke against check karta hai.
- [x] Delivery fee server par calculate karna. Server ₹200 threshold ke basis par free delivery ya ₹40 fee apply karta hai.
- [x] Final total server par calculate karna. Order total server-side catalog prices aur delivery fee se calculate hota hai.
- [x] FEFO inventory deduction ko checkout flow mein enforce karna. Stock expiry date ke ascending order mein allocate aur deduct hota hai.
- [x] Prescription verification bypass ko prevent karna. Rx medicines ke liye same-user approved prescription required hai.
- [x] Client-side total manipulation ko prevent karna. Client subtotal, fee ya total server ko authoritative value ke roop mein nahi bhejta.
- [x] Direct order creation aur backend order creation ko single flow mein consolidate karna. Checkout ab sirf backend API se order create karta hai.

Relevant file:

- `src/app/checkout/page.tsx`
- `src/app/api/v1/orders/checkout/route.ts`

## 3. Payment integration complete karna

- [ ] Razorpay order creation integrate karna.
- [ ] Payment success callback implement karna.
- [ ] Payment failure handling implement karna.
- [ ] Razorpay webhook production secret configure karna.
- [ ] Webhook signature verification test karna.
- [ ] Duplicate webhook/idempotency handling add karna.
- [ ] UPI/UTR verification complete karna.
- [ ] Refund processing ko order status ke saath connect karna.
- [ ] Payment status aur order status transitions verify karna.

Relevant file:

- `src/app/api/v1/payments/webhook/route.ts`

## 4. Pharmacist dashboard banana

Backend pharmacist APIs available hain, lekin complete pharmacist frontend dashboard banana baki hai.

- [x] Pending prescriptions ki list banana. `/pharmacist` dashboard queue API se pending prescriptions load karta hai.
- [x] Prescription image/document viewer add karna. Signed prescription URL viewer aur new-tab link available hai.
- [x] Prescription details display karna. Customer, phone, prescription ID, status aur submission time show hote hain.
- [x] Medicines approve/reject karne ka workflow add karna. Review API ke approve/reject actions wired hain.
- [x] Pharmacist notes ka form add karna. Review submit karne se pehle notes required hain.
- [x] Prescription status display karna. Queue aur selected review panel mein status visible hai.
- [x] Customer notification flow connect karna. Dashboard review API call karta hai, jo existing notification service trigger karti hai.
- [x] Pharmacist-only access enforce karna. Frontend pharmacist/admin role gate aur backend role authorization dono active hain.
- [x] Admin ko pharmacist workflow ka access dena. Admin role queue aur review actions access kar sakta hai.

Relevant files:

- `src/app/api/v1/pharmacist/prescriptions/queue/route.ts`
- `src/app/api/v1/pharmacist/prescriptions/[id]/review/route.ts`

## 5. Delivery partner dashboard banana

Delivery role authentication mein defined hai, lekin delivery partner ke liye complete UI available nahi hai.

- [x] Assigned orders ki list banana. `/delivery` dashboard assigned-order API se orders load karta hai.
- [x] Customer address aur phone view add karna.
- [x] Pickup status update add karna.
- [x] Out-for-delivery status update add karna.
- [x] Delivered status update add karna.
- [x] Delivery location/tracking update add karna.
- [x] Delivery proof upload karna. Authorized delivery partners private storage mein proof upload kar sakte hain; delivered status proof ke bina disabled hai.
- [x] Failed delivery aur RTO flow add karna.
- [x] Delivery partner-only access enforce karna. Frontend role gate aur backend delivery-partner guard active hain.

Relevant file:

- `src/app/api/v1/delivery/orders/[id]/status/route.ts`

## 6. Security aur secrets improve karna

- [x] Hardcoded fallback JWT secret remove karna.
- [x] Hardcoded payment webhook secret remove karna.
- [x] Hardcoded courier webhook secret remove karna.
- [x] Supabase service role key ko environment variable se hi load karna.
- [x] Default/fake secrets ke badle production mein fail-fast behavior add karna.
- [x] Piesocket API key ko secure environment variable mein rakhna.
- [x] UPI ID ko environment variable se configure karna.
- [x] Production secrets ko source code aur git history se protect karna. Fallback secrets remove kiye gaye hain; existing exposed credentials ko rotate karna deployment owner ki next action hai.
- [x] `.env.example` file banana, bina real secrets ke.

Relevant files:

- `src/lib/supabaseClient.ts`
 - `src/lib/supabaseClient.ts`
- `src/app/api/v1/orders/checkout/route.ts`
- `src/server/services/storage.ts`
- `src/server/services/orderEngine.ts`
- `src/server/services/shipping.ts`
- `src/server/routes/webhooks.ts`

## 7. Supabase security policies configure karna

- [x] Normal customer ko sirf apne orders read karne dena. Supabase RLS policies `auth.uid() = user_id` ownership enforce karti hain.
- [x] Customer ko doosre users ke orders read karne se block karna. Order detail API bhi customer ownership verify karti hai.
- [x] Order status update ko admin/delivery role tak restrict karna. API, `user_role` enum और Supabase RLS अब केवल admin/delivery partner को status update की अनुमति देते हैं.
- [x] Prescription documents ko private rakhna. `prescriptions` bucket private है और `storage.objects` policies owner तथा pharmacist/admin staff access enforce करती हैं; application signed URLs use करती है.
- [x] Admin-only collections ko secure karna. Medicines, batches aur staff-managed resources par pharmacist/admin access policies configured hain.
- [x] Missing medicine requests ke access rules configure karna. Supabase table, authenticated API aur RLS policies customer ownership तथा pharmacist/admin staff access enforce karti hain.
- `supabase/schema.sql`
- `src/app/api/v1/orders/[id]/route.ts`
- `src/server/services/storage.ts`
- `src/components/PrescriptionResults.tsx`
- `src/app/admin/page.tsx`

## 8. Prescription upload ko production-ready banana

- [x] File type validation add karna. Upload API aur recognition UI JPEG, PNG, WEBP aur PDF allow karte hain.
- [x] File size limit enforce karna. Upload aur recognition flow 10MB limit enforce karte hain.
- [x] Private storage access enforce karna. Prescription files private bucket mein store hote hain.
- [x] Prescription URL ko public expose na karna. API storage path aur time-limited signed URL use karti hai.
- [x] Upload failure aur retry state add karna. Recognition/upload errors user-facing retry message show karte hain.
- [x] Expired prescription handling add karna. Checkout approved prescription ke `expires_at` ko validate karta hai.
- [x] Pharmacist approval ke bina prescription medicine checkout block karna.
- [x] AI recognition result ko blindly order mein add na karna. Sirf catalog matches cart mein add hote hain.
- [x] Unrecognized medicines ke liye clear customer flow add karna. Missing medicines request ki ja sakti hain.
- [x] Prescription review status customer ko dikhana. `/prescriptions` page aur owner-scoped `/api/v1/prescriptions` status API available hain.

## 9. Real order tracking aur courier integration

- [ ] Real courier API integrate karna.
- [ ] Real AWB generation configure karna.
- [ ] Courier webhook signature verification test karna. HMAC SHA-256 verification implemented hai; real courier signed-payload test credentials/config ke saath baki hai.
- [x] Tracking status sync implement karna. Courier webhook statuses ko order status aur tracking history mein sync kiya jata hai.
- [x] Customer tracking timeline complete karna. Orders page अब confirmation, preparation, shipment, out-for-delivery, delivery, cancellation, failed delivery और RTO states का customer-facing timeline दिखाता है.
- [x] Failed delivery handling add karna.
- [x] RTO handling add karna.
- [x] Cancelled order tracking behavior define karna. Cancelled orders ship nahi kiye ja sakte aur courier cancelled events `cancelled` status mein map hote hain.
- [x] Default/demo courier behavior ko production mein disable karna. Courier configuration missing hone par AWB generation fail-fast hoti hai; fake AWB/label generate nahi hote.

## 10. Customer-side features

- [x] Medicine detail page banana.
- [x] Related medicines add karna.
- [x] Stock availability display karna.
- [x] Dosage aur usage instructions display karna. Product page safe pharmacist-guidance instructions दिखाता है.
- [x] Prescription-required badge add karna.
- [x] Wishlist feature add karna. Customer-owned Supabase wishlist, API, wishlist page और medicine detail controls added.
- [x] Saved addresses add karna. Customer-owned address API, management page और checkout integration support added.
- [x] Reorder button add karna. Order history items can be restored to cart with quantity and stock checks.
- [x] Cancel order feature add karna. Customer cancellation is server-validated before shipment and uses the existing stock-release transition.
- [x] Return/refund request feature add karna. Delivered customers can submit a reason for staff review through a protected API and RLS-backed request table.
- [x] Invoice download add karna. Orders page generates a customer invoice with items, delivery details, payment method and totals as a downloadable printable HTML invoice.
- [x] Customer support/contact page banana. Phone, email, Instagram support और location details added.
- [x] Privacy policy page banana. Data collection, prescription privacy, sharing, security और contact guidance added.
- [x] Terms and conditions page banana. Service use, orders, prescriptions, payments, delivery, cancellation और account responsibilities documented.
- [x] Refund policy page banana. Cancellation, returns, refund review और damaged/incorrect item guidance documented.
- [x] Medical disclaimer add karna. Website limitations, safe medicine use, urgent-care guidance और prescription-recognition disclaimer added.

## 11. Home page incomplete interactions

- [x] Home page ka `How it Works` button functional banana. Button dedicated `/how-it-works` page par navigate karta hai.
- [x] `How it Works` ke liye modal ya dedicated page banana. Responsive dedicated page added with next-step links.
- [x] Modal/page mein prescription upload, pharmacist review aur delivery process explain karna. Three-step flow, privacy, order updates और pharmacist guidance documented.

Relevant file:

- `src/app/page.tsx`

## 12. Production testing

- [ ] Home page test karna.
- [ ] Catalog search test karna.
- [ ] Catalog filters test karna.
- [ ] Cart add/remove/quantity test karna.
- [ ] Login/logout test karna.
- [ ] Checkout validation test karna.
- [ ] COD flow test karna.
- [ ] UPI/payment flow test karna.
- [ ] Prescription upload test karna.
- [ ] AI prescription recognition test karna.
- [ ] Order history test karna.
- [ ] Admin login test karna.
- [ ] Admin order status update test karna.
- [ ] Pharmacist workflow test karna.
- [ ] Delivery workflow test karna.
- [ ] Tracking test karna.
- [ ] Mobile responsive layout test karna.
- [ ] Supabase production configuration test karna.
- [ ] Supabase production configuration test karna.
- [ ] Webhook endpoints ko production environment mein test karna.

## Recommended implementation order

1. Dependencies install karke lint/build fix karna.
2. Environment variables aur secrets secure karna.
 3. Supabase security policies configure karna.
4. Checkout ko secure backend API se connect karna.
5. Payment gateway aur webhooks complete karna.
6. Prescription approval enforcement add karna.
7. Pharmacist dashboard banana.
8. Delivery partner dashboard banana.
9. Courier/tracking integration complete karna.
10. Legal pages aur customer-side features add karna.
11. Full production testing karna.

## Current audit summary

 UI ka foundation ready hai, lekin secure production order flow, payment verification, pharmacist workflow, delivery workflow, Supabase policies aur deployment configuration abhi sabse important pending parts hain.
