<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="auth.aspx.cs" Inherits="Agent_Desktop_WA.auth" %>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
    <head runat="server">
        <title></title>
    </head>

    <body>
        <script>
            const url = '/agent-desktop/';
            const autoLogin = false;

            const lanId = '<%:Page.User.Identity.Name %>';
            const search = `${location.search ? `${location.search}&` : '?'}${autoLogin ? 'al=1' : 'al=0'}`;
            const queryParams = lanId ? `?u=${lanId}${search.replace('?', '&')}` : search;

            location.href = `${url.endsWith('/') ? url : url + '/'}${queryParams}`;
        </script>
    </body>
</html>
