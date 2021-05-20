<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="auth.aspx.cs" Inherits="Agent_Desktop_WA.auth" %>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>

<body>
    <script>
        const url = '/agent-desktop/';

        const lanId = '<%:Page.User.Identity.Name %>';
        const queryParams = lanId ? `?u=${lanId}${location.search.replace('?', '&')}` : location.search;

        location.href = `${url.endsWith('/') ? url : url + '/'}${queryParams}`;
    </script>
</body>

</html>
