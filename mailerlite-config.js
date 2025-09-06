// MailerLite Configuration for Nashr Foundation
// Simple and reliable newsletter management

// Set your MailerLite API key here
// Get it from: https://dashboard.mailerlite.com/integrations/api
window.MAILERLITE_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMjdmOWZiY2U3NzMyY2E1ZGYyMDhhYTMwZDA1YmZkZWMxNDg4MzFkYzMxMGZlMTQ0YWNhNWNlZDdlOGUyYzVkNzg0NDg3NGU1MGNkMzM3ZDIiLCJpYXQiOjE3NTcxNTA2NTIuNDQ4Nzc0LCJuYmYiOjE3NTcxNTA2NTIuNDQ4Nzc3LCJleHAiOjQ5MTI4MjQyNTIuNDQ1MTgzLCJzdWIiOiIxNzk1NzYyIiwic2NvcGVzIjpbXX0.Jl1UpnfbIH7dRUd10KIgFp9lE-qut_mvL_J6NTN5b13L9VQMXIlpRBNOHBnp1h3mI1O8xPa_5Mh9kD3UstUwH7BaTdyJ5Yy_oK3KGvQXyY3fp_1bEsCd5GMscUxrgloYAjGsyH1tUtp2gjBVW78TMcAMau2La8efyxENUqgGiTE35NxVp__sAhE0AzEuuh2cZtuoKCQrIH22IjIeTCAJlD4ek8vZsL54_9DAm7tf6p9In7fqQLOjvsL2DktnCtXdsV-GrkfkaLVXs-goK_XFC6RrjdfiRSy-m83iGnGua5wffuM7h6By-JrbDxln4ICsbl9NnUd7_yWByVk0jF5Wlrf2nyPMcTcFYhP0DWMTiBKV06cBFKEcCW18Dk4yJ0Zpt7sITZdOqKWkgCnzrplnGiqO5n8MAFU44Oo5WU1wo0R1hVFDVWxjbDbR0DWVHBWSLuJCjAzO_1_msiyEOYZw5iNCJBfQ7Hc2gRB2rP3lFEdyr7tSJWVsOxp7WxkKoRsiSpuMQJlU4Ohvr6tbnjPPWFS5jR2dTUaYXvVQcI1mmxrdPTR7rdcck2A2jAN7TxYIeMe_qWfs7XtINonn4ly1jShDl5UGeyLydX5Wt7HkM9w3EpeGxIHh6qr4NzmO0VC-CDwPHXzsA9HCPkEHcXSFWIXwmTyLX0vwil7cVq9qcsg';

// Auto-initialize MailerLite service
document.addEventListener('DOMContentLoaded', function() {
    if (window.MAILERLITE_API_KEY && window.MAILERLITE_API_KEY !== 'YOUR_MAILERLITE_API_KEY_HERE') {
        window.mailerLiteService.initialize(window.MAILERLITE_API_KEY);
        console.log('✅ MailerLite service configured');
    } else {
        console.warn('⚠️ MailerLite not configured. Please set your API key in mailerlite-config.js');
    }
});

console.log('📧 MailerLite Configuration loaded');
