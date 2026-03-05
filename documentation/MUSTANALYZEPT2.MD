This is a document pertaining to software things that must be polished and be fixed in our system.

Note: Do not forgot to use our rules in this codespace: `codingRules.instructions.md`, `ENGINEERING_STANDARDS_FRAMES.md.instructions.md`, `FRAMES_DEPLOYMENT_CONSTRAINTS.instructions.md`, `FRAMES_OBSERVABILITY_RULES.instructions.md`, `FRAMES_SECURITY_RULES.instructions.md`, `FRAMES_TESTING_RULES.instructions.md`

Note: Changes in the database must be migrated or have files for migration that can be run in the SQL editor.

1. Let us implement data minimization where you only get the data that is necessary. Let us analyze the following tables and fields in the database `FRAMES_Data_Dictionary.md`. Correct me if I am wrong but for example: In users table, there are so many fields that are not necessary like`year_level` because it can be a derived data from the section, just find the only single digit number in the section field and that is their year level. `current_term` is also unnecessary? because the department head already set the current term in departments table? That should reflect to all students and faculty under their department. `contact_number`, `birthday`, `home_address`, `acedmica_advisor`, `gpa`, `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_phone`, `emergency_contact_address` ARE ALL FIELDS THAT ARE NOT NECESSARY. Faculty member and department head in their classes schedule can set the late threshold minutes. They can toggle to set if they want to set how many minutes to be considered late or they can toggle to not set and just remain the default value of `late_threshold_minutes`which must be 0. In `remarks` of table `attendance_logs` there should mark those who tried to use the recogniztion but unknown or unregistered, the only thing is it wont be having user_id. The `security_logs` table must be populated properly and also how to know if they should mark it as UNRECOGNIZED_FACE, GESTURE_FAILURE, SPOOF_ATTEMPT, UNAUTHORIZED_ACCESS. Also, populate properly the `audit_logs` table, `system_metrics` table and `notifications` table. Also, there are tables like `support_tickets` and `user_settings` they should be populated properly and used or implemented properly. Here below is their DDL. Remember that we do not have admin now. Create a migration sql for ALL OF THESE I can run in sql editor and update out data dictionary as well as all codes that will be affected since we plan to delete some. 
-- public.support_tickets definition

-- Drop table

-- DROP TABLE public.support_tickets;

CREATE TABLE public.support_tickets ( id serial4 NOT NULL, user_id int4 NOT NULL, subject varchar(255) NOT NULL, message text NOT NULL, status public."ticketstatus" NULL, created_at timestamp NULL, CONSTRAINT support_tickets_pkey PRIMARY KEY (id));
CREATE INDEX ix_support_tickets_user_id ON public.support_tickets USING btree (user_id);

-- Permissions

ALTER TABLE public.support_tickets OWNER TO avnadmin;
GRANT ALL ON TABLE public.support_tickets TO avnadmin;


-- public.support_tickets foreign keys

ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id); 

-- public.user_settings definition

-- Drop table

-- DROP TABLE public.user_settings;

CREATE TABLE public.user_settings ( id serial4 NOT NULL, user_id int4 NOT NULL, email_notifications bool NULL, sms_notifications bool NULL, push_notifications bool NULL, theme varchar(50) NULL, "language" varchar(20) NULL, CONSTRAINT user_settings_pkey PRIMARY KEY (id));
CREATE UNIQUE INDEX ix_user_settings_user_id ON public.user_settings USING btree (user_id);

-- Permissions

ALTER TABLE public.user_settings OWNER TO avnadmin;
GRANT ALL ON TABLE public.user_settings TO avnadmin;


-- public.user_settings foreign keys

ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


2. In notifications, is there an onvercrowding alert to Department Head and Faculty member? Like if the room they are teaching with an active schedule (faculty member and head) or the room that is under his department even though he is not teaching that ctive aschedule (head) will be notified if the room is overcrowding. The `room_capacity` can be set by the department head. It's deault value must be 50.

3. You did not answer these questions properly or yu answered but I could not see where you answers are: `Also, the database seems to be lagging or slow, espscially when all there is a poor network connection. Can it be fixed?`, `I also noticed that there when I clean the database, the facial recognition can still be run. However, it recognizes old data. It means, do we always need to run export_embeddings.py?`. `In landing page, I am not sure yet what to do. I need to consult my adviser first. in signing up for a faculty account, once sign up, the department head must verify first before the registration. once verified, an automated mail will be generated for the faculty member to sign in lor log in. but our professor says, it is hassle. remove the verification becuase we want to lessen the burden of the department head. however, it is for security. like if there is no like that, all accessors of that sign up page can sign up ofr those roles. what can be alternative that is mo simple yet secure? we plan to remove the sign up page in the landing page then give the link only? through automated emails or what. also, what if the use of codes? one time use of codes? wait it is so unclear to me. can ou suggest and how can we implement it? All I want for this section is opinion NOT implementation thru coding.`, and `Watch demo - we don't have contents here yet. Can you suggest how can we make a demo video using AI?`, and `i do not know here in system logs where are the data to be collected fetched. make this page works and explain how`

![alt text](image.png)
![alt text](image-1.png)

4. In log-or sign in, it follows what I want however I want it also that the sign in for faculty member / department head (under `faculty` name because they are all faculty) and student is separated (not in the same window) like the image-1 above but login.

![alt text](image-2.png)

5. Report generation- remove admin. must be student, faculty memebrs and department head.

![alt text](image-3.png)

6. footer - instead of twitter or X, replace it with `threads = https://www.threads.com/@lenayanaaa?igshid=NTc4MTIwNjQ2YQ==`

![alt text](image-4.png)

7. employee id shall be checked for its uniqueness. 

![alt text](image-5.png)

8. fix the UI it overlaps or exceeds the window.

![alt text](image-6.png)
![alt text](image-8.png)

9. this should be employee Id since he is faculty. again, tup-m id is for students only. Also, when i hit approve or reject, the notification should not be "local host:3000 says..." it should pop up in the middle of screen or modern notification confirming that the action has been done. employee id is not fetched also.

![alt text](image-7.png)

10. when i am clicking refresh, itis saying that "Failed to load user data. Check backend connection." but hwen i refresh manually on the site, it works. remove the refresh button.

![alt text](image-9.png)

11. email does not send. can't perform forgot password

![alt text](image-10.png)

12. if this is not configured yet the academic year settings, there should bea warning or reminder to configure it now. also the default values that is shown there must be "configure it now" instead of showing unreal data. Also, i already saved the start date and end date but it does not reflect in the semester_start_date and semester_end_date in the database.'



![alt text](image-11.png) 
![alt text](image-15.png)
13. UI IS BAD, see it not harmonious. Also when you hit register deive, there should be a confirmation that you registred the device successfully or not. There should be a tooltip regarding what does last heartbeat means. And also, aside from delete action, it should have an edit function.

![alt text](image-13.png)

14. number of enrolled students in that subject are not fetched. 

![alt text](image-14.png)

15. If you select assign room in a subject. the default values of the field shall be their initial values.

![alt text](image-16.png)
16. This shoud also reflect the name of the subject as well as the section they are handling.

![alt text](image-17.png)

17. In editing,it should not edit the name of the student and the TUP-M ID here. The editable should be the time only in and it will automatically reflect the status. The department head or faculty member in this section can override the time in of their students. Also, add column for time out.

![alt text](image-18.png)

18. The 'my students' does not work. it should be redirected to my classes and the fetched data here or display data here should be the number of students enrolled in `my classes`

![alt text](image-19.png)
![alt text](image-20.png)

19. why do they say, it has records when there is no rcords since i just cleared the database.? Also, semestral dates should reflect from the time the department head set the semester start date and semester end date

![alt text](image-21.png)

20. in department heaad, there are missing in the reports. the class-specific reports (since he still teaches so technically the subjects he teaches) and personal records (see the reports in for faculty member)

![alt text](image-22.png)

21. Maybe this is wehre support_tickets table in database works? Also, add a column and field where you need to upload evidences (jpg format or pdf format), if pdf format, 1 file only. if jpg, 3 files only.

FACULTY

![alt text](image-24.png)

22. Appropriate information is not fetched properly. College should be college of science, employee id must be fetched, academic year and semester must be fetched.

![alt text](image-25.png)

23. in dashboard, it should be employee instead of faculty  id. Today's classes when click shall be redirected to my classes, the same as active classes, total students. Average is attendance is for reports maybe? and how does it come up with that.

![alt text](image-26.png)

24. When I clicked attendance tab and filter the subject, it went to the image above this task number. error: RangeError: Invalid time value
    at Date.toISOString (<anonymous>)
    at FacultyAttendancePage.jsx:103:52
    at Array.filter (<anonymous>)
    at getFilteredStudents (FacultyAttendancePage.jsx:95:28)
    at summaryCounts (FacultyAttendancePage.jsx:140:26)
    at FacultyAttendancePage (FacultyAttendancePage.jsx:149:20)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=aa399003:18509:20)
    at renderWithHooks (react-dom_client.js?v=aa399003:5654:24)
    at updateFunctionComponent (react-dom_client.js?v=aa399003:7475:21)
    at beginWork (react-dom_client.js?v=aa399003:8525:20)

The above error occurred in the <FacultyAttendancePage> component.

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.

defaultOnCaughtError @ react-dom_client.js?v=aa399003:7001Understand this error
ErrorBoundary.jsx:23 [FRAMES ErrorBoundary] RangeError: Invalid time value
    at Date.toISOString (<anonymous>)
    at FacultyAttendancePage.jsx:103:52
    at Array.filter (<anonymous>)
    at getFilteredStudents (FacultyAttendancePage.jsx:95:28)
    at summaryCounts (FacultyAttendancePage.jsx:140:26)
    at FacultyAttendancePage (FacultyAttendancePage.jsx:149:20)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=aa399003:18509:20)
    at renderWithHooks (react-dom_client.js?v=aa399003:5654:24)
    at updateFunctionComponent (react-dom_client.js?v=aa399003:7475:21)
    at beginWork (react-dom_client.js?v=aa399003:8525:20) 
    at FacultyAttendancePage (http://localhost:3000/src/components/FacultyDashboard/FacultyAttendancePage.jsx:37:17)
    at ErrorBoundary (http://localhost:3000/src/components/Common/ErrorBoundary.jsx:7:5)
    at RenderedRoute (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=aa399003:6301:26)
    at Outlet (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=aa399003:7082:26)
    at div (<anonymous>)
    at div (<anonymous>)
    at div (<anonymous>)
    at FacultyLayout (http://localhost:3000/src/components/FacultyDashboard/FacultyLayout.jsx:283:20)
    at ErrorBoundary (http://localhost:3000/src/components/Common/ErrorBoundary.jsx:7:5)
    at ProtectedRoute (http://localhost:3000/src/components/Common/ProtectedRoute.jsx:21:27)
    at RenderedRoute (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=aa399003:6301:26)
    at Routes (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=aa399003:7150:3)
    at div (<anonymous>)
    at Router (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=aa399003:7091:13)
    at BrowserRouter (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=aa399003:10287:3)
    at ToastProvider (http://localhost:3000/src/components/Common/ToastProvider.jsx:30:33)
    at AuthProvider (http://localhost:3000/src/context/AuthContext.jsx:21:32)
    at App (<anonymous>)

![alt text](image-27.png)

25. academic information not fetched properly. the student is enrolled in a subject with the program under a specific college and department so therefore it should fetched. also the set semester and academic year set by the department head

![alt text](image-12.png)
27. This works noww. however, i requested "for now, even though it is not matched, let us make it slip for now so i can test the data. just override it first with the data set by the department head" for us to test it. but now we already tested it so we can revert from the original where you can't upload schedule if it does not match academic year and semester set by the department head. Also, make a comment to what I can do if we want to revert it back for overwritten

27. Analyze and fix if needed also the `backendlogs.txt`


