/**
 * Created by chenpeng on 14-3-24.
 */

window.onload= function()
{
    console.log("init");
    if(document.getElementById('pw'))
    {
        document.getElementById('pw').focus();
        GetCookie();
    }
};

function checkform()
{
    if( $("#pw").val() == "")
    {
        document.getElementById('pw').focus();
        return false;
    }
    else
    {
        saveInfo();
        return true;
    }
}

function saveInfo(){
    try{

        var userpsw = document.getElementById('pw').value;
        if(userpsw!="" ){
            SetCookie(userpsw);
        }
    }catch(e){

    }
}

function SetCookie(psw){
    var Then = new Date()
    Then.setTime(Then.getTime() + 1866240000000)
    document.cookie = "passWord=" + psw+";expires="+ Then.toGMTString();
}


function GetCookie(){
    var psd;
    var cookieString = new String(document.cookie)
    var cookieHeader = "passWord="
    var beginPosition = cookieString.indexOf(cookieHeader)
    cookieString = cookieString.substring(beginPosition);
    var ends=cookieString.indexOf(";");
    if (ends!=-1){
        cookieString = cookieString.substring(0,ends);
    }
    if (beginPosition>-1){
        psd = cookieString.substring(cookieHeader.length);
        if (psd!=""){
            document.getElementById('pw').value=psd;
        }
    }
}