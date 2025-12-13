//年のプルダウン生成
function createYearDropdown(){
    const select = document.createElement("select");
    for(let i = 2015; i <= 2035; i++){
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        select.appendChild(option);
    }
    select.classList.add("year-select");
    return select;
}
const year = document.querySelector(".year");
year.parentNode.insertBefore(createYearDropdown(),year);

//月のプルダウン生成
function createMonthDropdown(){
    const select = document.createElement("select");
    for(let i = 1; i <= 12; i++){
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        select.appendChild(option);
    }
    select.classList.add("month-select");
    return select;
}
const month = document.querySelector(".month");
month.parentNode.insertBefore(createMonthDropdown(),month);


// ヘッダー生成（日付）
const shiftTable = document.getElementById("shiftTable");
const shiftCreateBtn = document.querySelector(".shiftCreate");
const shiftHeader = shiftTable.querySelector("thead tr");
const tbody = shiftTable.querySelector("tbody");

shiftCreateBtn.addEventListener("click",() =>{
    while (shiftHeader.children.length > 2) {//重複してthが追加されないよう最初にクリアする。
        shiftHeader.removeChild(shiftHeader.lastChild);
    }
    tbody.innerHTML = ""; //tbodyに重複して要素が追加されないようHTMLを空にする。
    const yearSelect = document.querySelector(".year-select");
    const monthSelect = document.querySelector(".month-select");
    const daysInMonth = new Date(yearSelect.value, monthSelect.value, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const th = document.createElement("th");//thを生成
        th.textContent = d;//生成したthのテキストはd
        shiftHeader.appendChild(th);//thを氏名、職種の後ろに（右？）に追加
    }
});


//出勤時間～退勤時間のプルダウンを生成
function createTimeOptions(select){
    for(let h=0; h<24; h++){
        for(let m=0; m<60; m+=15){
            const hour = String(h).padStart(2,'0');
            const min  = String(m).padStart(2,'0');
            const option = document.createElement("option");
            option.value = `${hour}:${min}`;
            option.textContent = `${hour}:${min}`;
            select.appendChild(option);
        }
    }
}

//出勤時間～退勤時間のプルダウンをサービス提供時間のselectに埋め込む。
const serviceTime = document.querySelectorAll(".service-time select");
serviceTime.forEach(select => createTimeOptions(select));

// 職員ごとの行を生成
const addRowBtn = document.querySelector(".add-row");

addRowBtn.addEventListener("click", () => {
    const row = document.createElement("tr");
    //氏名・職種
    row.innerHTML = `
        <td><input type="text" placeholder="氏名を入力"></td>
        <td>
          <select>
            <option value="児発管">児発管</option>
            <option value="児童指導員">児童指導員</option>
            <option value="保育士">保育士</option>
            <option value="その他">その他</option>
          </select>
        </td>`;
    tbody.appendChild(row);

    //出勤時間
    const yearSelect = document.querySelector(".year-select");
    const monthSelect = document.querySelector(".month-select");
    const daysInMonth = new Date(yearSelect.value, monthSelect.value, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const td = document.createElement("td");
        const startSelect = document.createElement("select");
        const endSelect = document.createElement("select");

        createTimeOptions(startSelect);
        createTimeOptions(endSelect);

        td.appendChild(startSelect);
        td.append(" ～ ");
        td.appendChild(endSelect);
        row.appendChild(td);
    }
});

//審査結果ボタンを押したときの処理
const judgeTbody = judgeTable.querySelector("tbody");
const judgeBtn = document.querySelector(".judgement");
const toNum = t => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

judgeBtn.addEventListener("click", () => {
    //サービス提供時間未設定時のアラート
    const serviceTimeSelects = document.querySelectorAll(".service-time select");
    const startSelect = serviceTimeSelects[0];
    const endSelect = serviceTimeSelects[1];
    const serviceStart = toNum(startSelect.value);
    const serviceEnd = toNum(endSelect.value);
    if (serviceStart === serviceEnd || serviceStart > serviceEnd) {
        alert("サービス提供時間を正しく設定してください。");
        return;
    }
    //日付ヘッダーの生成
    const yearSelect = document.querySelector(".year-select");
    const monthSelect = document.querySelector(".month-select");
    const daysInMonth = new Date(yearSelect.value, monthSelect.value, 0).getDate();
    const judgeTable = document.getElementById("judgeTable");
    const judgeHeader = judgeTable.querySelector("thead tr");

    while (judgeHeader.children.length > 1) { //重複してtdが追加されないよう最初にクリアする。
        judgeHeader.removeChild(judgeHeader.lastChild);
    }

    judgeTbody.innerHTML = ""; //tbodyに重複して要素が追加されないようHTMLを空にする。

    for (let d = 1; d <= daysInMonth; d++) {
        const th = document.createElement("th");//thを生成
        th.textContent = d;//生成したthのテキストはd
        judgeHeader.appendChild(th);//thを氏名、職種の後ろに（右？）に追加
    };

    //審査（基準人員）
    const rows = document.querySelectorAll("#shiftTable tbody tr");
    const helperRow = document.createElement("tr");
    const helperTd = document.createElement("td");
    helperTd.textContent = "基準人員";
    judgeTbody.appendChild(helperRow);
    helperRow.appendChild(helperTd);

    for (let d = 1; d <= daysInMonth; d++) {
        const td = document.createElement("td");
        let isOk = true;

        // 15分単位でチェックする（9:00⇒9:15⇒9:30...）
        for (let t = serviceStart; t < serviceEnd; t += 15) {
            let count = 0;

            rows.forEach(row => {
                const role = row.querySelector("td:nth-child(2) select").value;

                 // 保育士でも児童指導員でもなければ確認しない。
                if (!(role.includes("児童指導員") || role.includes("保育士"))) return;

                const dayCell = row.querySelector(`td:nth-child(${d + 2})`);//３つ目のtd（各日の出勤時間）
                 if (!dayCell) return;

                const selects = dayCell.querySelectorAll("select");
                if (selects.length < 2) return;//selectsの要素数が１以下の場合は処理をスキップ。

                const wStart = toNum(selects[0].value);
                const wEnd = toNum(selects[1].value);

                // tがこの職員の勤務内に含まれているか
                if (wStart <= t && t < wEnd) {
                    count++;
                }
            });

            if (count < 2) {
                isOk = false;
                break; // どこかの時間帯で1度でも不足したら不可、次の日の処理に移る。
            }
        }

        td.textContent = isOk ? "可" : "不可";
        helperRow.appendChild(td);
    }

    //審査（児発管）
    const managerRow = document.createElement("tr");
    const managerTd = document.createElement("td");
    managerTd.textContent = "児発管";
    judgeTbody.appendChild(managerRow);
    managerRow.appendChild(managerTd);

    let workTime = 0;
    for (let d = 1; d <= daysInMonth; d++){
        rows.forEach(row =>{
            const role = row.querySelector("td:nth-child(2) select").value;
            if(role.includes("児発管")){
                const dayCell = row.querySelector(`td:nth-child(${d + 2})`);
                if (!dayCell) return;

                const selects = dayCell.querySelectorAll("select");
                if (selects.length < 2) return;

                const wStart = toNum(selects[0].value);
                const wEnd = toNum(selects[1].value);

                if(wStart < wEnd){
                    workTime += (wEnd - wStart);
                };
            };
        });

    };
    
    const fullTimeSelect = document.querySelector(".full-time select").value;
    let fullTime = Number(fullTimeSelect);
    let isOk = true;

    if(workTime < fullTime * 240){//60分×4週
        isOk = false;
    };

    const managerJudgeTd = document.createElement("td");
    managerJudgeTd.textContent = isOk ? "可" : "不可";
    managerRow.appendChild(managerJudgeTd);
});
