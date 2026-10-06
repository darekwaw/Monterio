; Instalator Monterio (Inno Setup 6). Budowanie: installer\build.ps1
#define AppName "Monterio"
#define AppVersion "1.0.0"
#define ServiceName "Monterio"

[Setup]
AppId={{6F1B7A52-3C0E-4D8A-9E57-4D6F0C2A91B3}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Petrosoft
DefaultDirName={autopf}\Monterio
DisableProgramGroupPage=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=build
OutputBaseFilename=Monterio-Setup-{#AppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName={#AppName}

[Languages]
Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"

[Files]
Source: "build\stage\app\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion; Excludes: "appsettings.Local.json"
Source: "configure.ps1"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "build\stage\Monterio-Instalator.apk"; DestDir: "{app}\mobile"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\docs\instalacja.md"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[UninstallRun]
Filename: "{sys}\sc.exe"; Parameters: "stop {#ServiceName}"; Flags: runhidden; RunOnceId: "StopSvc"
Filename: "{sys}\sc.exe"; Parameters: "delete {#ServiceName}"; Flags: runhidden; RunOnceId: "DelSvc"
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""Monterio"""; Flags: runhidden; RunOnceId: "DelFw"

[Code]
var
  CfgPage: TInputQueryWizardPage;

function ServiceExists: Boolean;
var rc: Integer;
begin
  Result := Exec(ExpandConstant('{sys}\sc.exe'), 'query {#ServiceName}', '', SW_HIDE, ewWaitUntilTerminated, rc) and (rc = 0);
end;

function ConfigFile: String;
begin
  Result := ExpandConstant('{app}\appsettings.Local.json');
end;

function GetPort(Param: String): String;
begin
  if (CfgPage <> nil) and (Trim(CfgPage.Values[4]) <> '') then Result := Trim(CfgPage.Values[4]) else Result := '5020';
end;

procedure InitializeWizard;
begin
  CfgPage := CreateInputQueryPage(wpSelectDir, 'Konfiguracja bazy i serwera',
    'Monterio wymaga Microsoft SQL Server (np. SQL Express). Baza zostanie utworzona automatycznie.',
    'Zalecane logowanie SQL (login/hasło). Puste pola = uwierzytelnianie Windows, ale usługa działa jako konto SYSTEM i wymaga wtedy loginu SQL dla tego konta z rolą dbcreator.');
  CfgPage.Add('Serwer SQL (np. localhost\SQLEXPRESS):', False);
  CfgPage.Add('Nazwa bazy danych:', False);
  CfgPage.Add('Login SQL (opcjonalnie):', False);
  CfgPage.Add('Hasło SQL:', True);
  CfgPage.Add('Port aplikacji:', False);
  CfgPage.Add('Adres, pod którym użytkownicy otwierają Monterio (np. http://serwer:5020):', False);
  CfgPage.Values[0] := 'localhost\SQLEXPRESS';
  CfgPage.Values[1] := 'MonterioDb';
  CfgPage.Values[4] := '5020';
  CfgPage.Values[5] := 'http://' + GetComputerNameString + ':5020';
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  // Aktualizacja: konfiguracja (sekrety, baza) już istnieje — nie pytamy ponownie.
  Result := (CfgPage <> nil) and (PageID = CfgPage.ID) and FileExists(ConfigFile);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if (CfgPage <> nil) and (CurPageID = CfgPage.ID) then
  begin
    if (Trim(CfgPage.Values[0]) = '') or (Trim(CfgPage.Values[1]) = '') or (Trim(CfgPage.Values[4]) = '') or (Trim(CfgPage.Values[5]) = '') then
    begin
      MsgBox('Uzupełnij serwer SQL, nazwę bazy, port i adres aplikacji.', mbError, MB_OK);
      Result := False;
    end
    else if Trim(CfgPage.Values[2]) = '' then
      // Usługa działa jako LocalSystem — bez loginu SQL baza zwykle się nie utworzy.
      Result := MsgBox('Nie podano loginu SQL, więc zostanie użyte uwierzytelnianie Windows.' + #13#10#13#10 +
        'Usługa Monterio działa jako konto SYSTEM (na polskim Windows: "ZARZĄDZANIE NT\SYSTEM"), które musi mieć na serwerze SQL login z rolą dbcreator — inaczej usługa nie utworzy bazy i się nie uruchomi.' + #13#10#13#10 +
        'Zalecane: podaj login i hasło SQL.' + #13#10#13#10 + 'Kontynuować bez loginu SQL?', mbConfirmation, MB_YESNO or MB_DEFBUTTON2) = IDYES;
  end;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var rc: Integer;
begin
  Result := '';
  if ServiceExists then
  begin
    Exec(ExpandConstant('{sys}\sc.exe'), 'stop {#ServiceName}', '', SW_HIDE, ewWaitUntilTerminated, rc);
    Sleep(4000);
  end;
end;

procedure Sc(Params: String);
var rc: Integer;
begin
  Exec(ExpandConstant('{sys}\sc.exe'), Params, '', SW_HIDE, ewWaitUntilTerminated, rc);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var rc, i: Integer; args: String; ok: Boolean;
begin
  if CurStep = ssPostInstall then
  begin
    if not FileExists(ConfigFile) then
    begin
      args := '-NoProfile -ExecutionPolicy Bypass -File "' + ExpandConstant('{app}\tools\configure.ps1') + '"' +
        ' -InstallDir "' + ExpandConstant('{app}') + '"' +
        ' -Server "' + Trim(CfgPage.Values[0]) + '" -Database "' + Trim(CfgPage.Values[1]) + '"' +
        ' -SqlUser "' + Trim(CfgPage.Values[2]) + '" -SqlPassword "' + CfgPage.Values[3] + '"' +
        ' -Port ' + Trim(CfgPage.Values[4]) + ' -PublicUrl "' + Trim(CfgPage.Values[5]) + '"';
      if not Exec('powershell.exe', args, '', SW_HIDE, ewWaitUntilTerminated, rc) or (rc <> 0) then
        MsgBox('Nie udało się wygenerować konfiguracji (kod ' + IntToStr(rc) + '). Uruchom ręcznie tools\configure.ps1.', mbError, MB_OK);
    end;
    if not ServiceExists then
      Sc('create {#ServiceName} binPath= "' + ExpandConstant('{app}\Monterio.API.exe') + '" start= auto DisplayName= "Monterio"');
    Sc('description {#ServiceName} "Monterio - zarzadzanie zleceniami montazowymi"');
    Sc('failure {#ServiceName} reset= 86400 actions= restart/5000/restart/5000/restart/30000');
    Exec(ExpandConstant('{sys}\netsh.exe'), 'advfirewall firewall delete rule name="Monterio"', '', SW_HIDE, ewWaitUntilTerminated, rc);
    Exec(ExpandConstant('{sys}\netsh.exe'), 'advfirewall firewall add rule name="Monterio" dir=in action=allow protocol=TCP localport=' + GetPort(''), '', SW_HIDE, ewWaitUntilTerminated, rc);
    Sc('start {#ServiceName}');
  end;
  if CurStep = ssDone then
  begin
    // Czekamy do 90 s na odpowiedź HTTP (przy pierwszym starcie usługa tworzy bazę i migruje schemat).
    ok := False;
    for i := 1 to 30 do
    begin
      if Exec('powershell.exe', '-NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:' + GetPort('') + '/login/ | Out-Null } catch { exit 1 }"', '', SW_HIDE, ewWaitUntilTerminated, rc) and (rc = 0) then
      begin
        ok := True;
        break;
      end;
      Sleep(3000);
    end;
    if not ok then
      MsgBox('Usługa Monterio nie odpowiada. Sprawdź dane połączenia z SQL Server w appsettings.Local.json oraz Podgląd zdarzeń Windows -> Dzienniki Windows -> Aplikacja.', mbError, MB_OK);
  end;
end;
