Color Coding
🔴 **To be Fixed**
🟡 **In ProgrWWess**
🟢 **Done**


🔴 **To be Fixed**
**PRIORITY**
iadvertise nyo na sa homepage yung app para dun nalang idownload ng panelists, or create an index page para lang sa app link 🔴 **To be Fixed**

(Alviar)
Admin Login Page (Faint IBT coverpage layout)
- layout revised 🔴 **To be Fixed**


(Lloyd) 
Add notificatiions in mobile module 🔴 **To be Fixed**
Mobile 
Dashboard: Change Icon to Logo not Bus
Lost and Found: Remove Description and swap it with Item Type, Fix the order in descding. If claimed remove it, only unclaimed should be visible
fix the otp verification for each admin per module (same flow as logging in superadmin part)
























🟢 **Done**
Revisions for web general 
- application rejection should have a note 🟢 **Done**
- fix mobile home module 🟢 **Done**

REVISIONS FOR WEB
- Fix ang Position ng Set Target sa Dashboard - 🟢 **Done**
- Buses Page dapat maka add New Company Buses - 🟢 **Done**
- Add Tooltip - 🟢 **Done**
- remove clear history - 🟢 **Done**
- add posting module in notify all for tenants 🟢 **Done**

Dashboard
- Fix Revenue value. Value does not reflect the submitted revenue (Lloyd) - 🟢 **Done**
- reflect the value submitted by the admins of different modules (Lloyd)- 🟢 **Done**
- Align set targets with download and week, month year, (Alviar) 🟢 **Done**
- remove value in the operation analytics (Venn) 🟢 **Done**
- notification status number is static.(venn) 🟢 **Done**
- fix superadmin dashboard monthly target card layout 🟢 **Done**
- connect set price change to actual prices for bus, terminal (lloyd) 🟢 **Done**

Bus Admin
- ticket ref should be unique (lloyd) - 🟢 **Done**
- submit report nawala (Alviar)  🟢 **Done**
- export file layout (jayna)   🟢 **Done**

Parkin Admin
- set price should only be visible in the superadmin (Alviar)  🟢 **Done**
- chane icon for jeep and motor (venn)    🟢 **Done**
- export file layout (venn)   🟢 **Done**

Lost and Found admin
- should not have a description (Jayna)  🟢 **Done**

Bus Admin
- plate no. not reflecting (lloyd) - 🟢 **Done**
- logs does not reflect archived trips (lloyd) - 🟢 **Done**

Terminal Fee
- remove date search filter (Alviar)  🟢 **Done**
- Change "Tickets" to "Terminal Fee" (Jayna)  🟢 **Done**
- as one ang student and senior filter (Venn) 🟢 **Done**
- export layout (Venn)   🟢 **Done**

Manage Employee
- create backend for the admins with role and connect it to MongoDB (lloyd) 🟢 **Done**
- NAME + role for admin, dynamic and encrypted accounts (Should reflect to the whole system) 🟢 **Done**
- should be able to edit name and email (Lloyd) 🟢 **Done**

Bugs 🟢 **Done**
- Make the design consistent for (set price/ add new/ export) options

Fixed
- Lost&Found - Di nag Sasave if mag add new  🟢 **Done**
- Dashboard - PDF download not working 🟢 **Done**
- Buses - set price working but not reflecting 🟢 **Done**
- Terminal fee - Student/senior/PWD save ticket not working / Set price mag save pero di nag rereflect sa table 🟢 **Done**
- Notification di nag reredirect 🟢 **Done**
- Tenant/Lease - If mag add ng new tenant di lumalabas sa map 🟢 **Done**

- Application red circle where there is a new application should not be shown after the rejection was read. 🟢 **Done**
- The last name is not separated, it joins in the middle name.🟢 **Done**
- Add suffix (Jr, Sr, etc.) 🟢 **Done**
- Add Products to be sold in the application review 🟢 **Done**

NEW TO DO LIST (Lost and Found Module)
Archive Button - Adjust the backend for this. dapat hindi sya magiging multo sa mobile kase ang data hindi pa nadelete sa mongo database if irestore mag error. Adjust the query nito. Addition, mag add ng toast message. (LLoyd) 🟢 **Done**
Delete Button - add a toast message, also check if nandun pa ang data sa mongodb, if meron pa kahit nadelete na, adjust ang backend (LLoyd) 🟢 **Done**
Archive button - iadjust ang backend nito kay if mawala yung data sa tenant page, nagiging multo sya sa mobile kase ang data is nandun lang sa mongo database. Addition, if irestore ng admin, dapat magbalik sya sa tenant table. (LLoyd) 🟢 **Done**
Delete button - iadjust din yung backend nito since nagiging ghost data sa mobile dinilete. Kahit nakadelete nasya, nandun parin ang data sa mongodb. (LLoyd) 🟢 **Done**



NEW TO DO LIST (TenantLease Module)
View modal - kailangan maview ang uploaded documents (Steph) 🟢 **Done**
Edit modal - kailangan maview ang uploaded documents (Steph) 🟢 **Done**
Download button - dapat same format sa mga ibang pdf exports (Jayna) 🟢 **Done**

NEW TO DO LIST (Report Module)
View button - dapat scrollable horizontally para di magoverlap ang ibang details sa container.
Export buttons - adjust the format dapat same pdf format sa lahat ng modules and adjust dapat din yung format excel. (Jayna) 🟢 **Done**
Add "X" icon button sa view modal (Ven) 🟢 **Done**
Archive Button - add toast message (Alviar) 🟢 **Done**
Delete Button - add toast message (Alviar) 🟢 **Done**

NEW TO DO LIST (Parking Module)
Add New+ button - Change the UI , dapat lighten lang ibase sa color ng counting cards, remove the border and adjust the color it should be the same as the counting cards. Change also the Font weight, it should be medium or basta hindi sya masyadong bold. (Ven) 🟢 **Done**

NEW TO DO LISTS (Deletion Request Module)
Add Logs button para malaman mga ginawa ng admin here sa module (Alviar) 🟢 **Done**

NEW TO DO LISTS (Terminal Fee Module)
Change the toast message, dapat same toast message lahat ng module, reference nyo na toast message is yung nasa parking module or tenant lease module. (Alviar) 🟢 **Done**

(Jayna)
NEW TO DO LIST (Report Module)
View button - dapat scrollable horizontally para di magoverlap ang ibang details sa container. 🟢 **Done**
Export buttons - adjust the format dapat same pdf format sa lahat ng modules and adjust dapat din yung format excel. 🟢 **Done**

(Ven)
NEW TO DO LIST (Parking Module)
Add New+ button - Change the UI , dapat lighten lang ibase sa color ng counting cards, remove the border and adjust the color it should be the same as the counting cards. Change also the Font weight, it should be medium or basta hindi sya masyadong bold. 🟢 **Done**
Add "X" icon button sa view modal 🟢 **Done**

- broadcast button sa tenants set a due date (within 1st 5 days of the month) to announce to all tenants in the permanent slot 🟢 **Done**
- send email in the tenants table if its working or not , needed to be fix 🟢 **Done**
- add set price for permanent slot. 🟢 **Done**

NEW TO DO LISTS (Terminal Fee Module)
Change the toast message, dapat same toast message lahat ng module, reference nyo na toast message is yung nasa parking module or tenant lease module. 🟢 **Done**

Revisions for web general 
- Add ng price setting sa Buses, Tickets, and Parking for future if tumaas ang fees. 🟢 **Done**

NEW TO DO LIST (Report Module)
View button - dapat scrollable horizontally para di magoverlap ang ibang details sa container. 🟢 **Done**
Export buttons - adjust the format dapat same pdf format sa lahat ng modules and adjust dapat din yung format excel. 🟢 **Done**
Add "X" icon button sa view modal 🟢 **Done**

Next payment due details (Tenant List Module) 🟢 **Done**
- Date 
- next amount to be paid
- add button for send payment receipt so that if the user is already paid it will shows in the payment record history
UI fix: 
- Add tenant Modal - add progress bar for uploading docs
- UI layout in view modal same as the layout in the editTenantLease modal in Financial breakdown section
- can't view uploaded documents after the contract review phase, in the add tenant modal. 🟢 **Done**

Bus Trips
- Add toast message after mag save ng new input Price. 🟢 **Done**

Revisions for web general 
- dashboard export format 🟢 **Done**

(Ven)
NEW TO DO LIST (Parking Module)
Add New+ button - Change the UI , dapat lighten lang ibase sa color ng counting cards, remove the border and adjust the color it should be the same as the counting cards. Change also the Font weight, it should be medium or basta hindi sya masyadong bold. 🟢 **Done**


(Steph) 🟢 **Done**
Mobile:
apply an another slot and on review after does not redirect to the specific under review tab slot, it redirect to the 1st tab slot you applied on
submit payment button desgn - only green border if not tap the button, after it tapped it will turn back to green same adjust also for submit contract button
when downloading a contract pdf, the users will receive a pdf contract after they the tap button.

can't view the uploaded documents after proceeding in add tenant when the user' slot application was approved
In submit next payment the data should be emptied in order to upload a new receipt for the next due payment since after the slot was approved, there is a data already in this section, and after that it should shows a tiny under review status in the specific due payment details section.

Web side:
The view modal can't view the uploaded documents same as the edit modal
The layout of the financial breakdown should be the same layout in the edit modal

after approving the renewal payment review it will update the reference number and shows in the modal and also it updates the due date in the edit modal.
62 slots in the stat card instead of 64 slots total
