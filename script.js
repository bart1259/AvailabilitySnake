$(document).ready(function() {

    canvas =  $('.snake-game').get(0);
    ctx = canvas.getContext("2d");
    snakeX = canvas.width / 2;
    snakeY = canvas.height / 2;
    setInterval(draw, 5);


    $("#addButton").click((e) => {
        if($("#configNameInput").val() != ""){
            sites.add(new Site($("#configNameInput").val(), $("#configUrlInput").val(), $("#configCmdInput").val()))
            $("#configNameInput,#configUrlInput,#configCmdInput").val("")
        } else {
            alert("Name cannot be empty")
        }
    })

    $("#applyButton").click((e) => {
        if(selectedRow){
            selectedRow.name = $("#configNameInput").val()
            selectedRow.url = $("#configUrlInput").val()
            selectedRow.cmd = $("#configCmdInput").val()
            sites.updateTable()
        }
    })

    $("#removeButton").click((e) => {
        if(selectedRow){
            sites.remove(selectedRow)
            selectedRow = null
        }
    })

    $("#rebootButton").click((e) => {
        if(selectedRow && selectedRow.status === "Down"){
            selectedRow.reboot()
            sites.updateTable()
        } else if (selectedRow){
            alert(selectedRow.name + " is not down")
        } else {
            alert("Nothing selected to reboot")
        }
    })

    // Setup
    sites.updateTable()

});

class Sites {
    constructor() {
        this.sites = []
        this.sites.push(new Site("Data API", "http://localhost:5000/alive", "py data_api/run.py"))

        setInterval(() => {
            this.sites.forEach((site) => {
                site.checkIfUp();
            })
            this.updateTable();
        }, 2000)
    }

    add(site) {
        this.sites.push(site)
        this.updateTable();
    }

    remove(site) {
        const index = this.sites.indexOf(site);
        if (index > -1) {
            this.sites.splice(index, 1);
          }
        this.updateTable();
    }

    updateTable() {
        // Empty table
        $("tbody").empty()

        //Recreate table
        this.sites.forEach((site) => {
            let row = $("tbody").append(site.getrow())
            if(selectedRow && site.name === selectedRow.name) {
                $("tbody").find(`td:contains("${site.name}")`).parent().css('background-color', 'rgb(196, 235, 203)')
            }
        })

        $(".status-row").click((e) => {
            // Called when a row is clicked
            $(".status-row").css('background-color', 'white')
            e.currentTarget.style.backgroundColor = "rgb(196, 235, 203)"
            selectedRow = sites.sites.find((a)=> {return a.name==e.currentTarget.children[0].innerHTML.trim()})
            $("#configNameInput").val(selectedRow.name)
            $("#configUrlInput").val(selectedRow.url)
            $("#configCmdInput").val(selectedRow.cmd)
        })
    }
}

class Site {
    constructor(name, url, cmd) {
        this.name = name;
        this.url = url;
        this.cmd = cmd;
        this.ticks = 0;
        this.upTicks = 0;
        this.status = "Unknown"
        this.immunity = 0
    }

    getAvailability() {
        if(this.ticks == 0){
            return 0;
        }
        return 100 * this.upTicks / this.ticks;
    }

    reboot() {
        this.status = "Rebooting..."
        this.immunity = 5;
        axios.post("http://localhost:52525/run_command", {"command": this.cmd})
    }

    checkIfUp() {

        if(this.immunity != 0) {
            this.immunity--;
        }

        $.ajax({
            url:this.url,
            timeout:1000, 
            success:(data) => {
                if(data.toLowerCase() === "ok" || data.toLowerCase() === "yes") {
                    this.ticks++;
                    this.immunity = 0;
                    this.upTicks++;
                    this.status = "Up"
                } else {
                    if(this.immunity !=0){
                        this.immunity--;
                        return;
                    }
                    this.ticks++;
                    this.status = "Down"
                }
            },
            error: () => {
                if(this.immunity !=0){
                    this.immunity--;
                    return;
                }
                this.ticks++;
                this.status = "Down"
            }
        })
    }

    getrow() {
        return `<tr class="status-row">
                    <td>${this.name}</th>
                    <td>${this.status}</td>
                    <td>${this.getAvailability().toFixed(5)}%</td>
                </tr>`
    }
}

let sites = new Sites() // Keep track of all the sites we track the availability of
let selectedRow = null


/// Canvas
let ctx;
let canvas;

let snakeX;
let snakeY;
let tick = 0;
const RADIUS = 10;

const draw = () => {

    if(sites.sites.filter(a => a.status==="Down").length == 0){
        ctx.strokeStyle = "#198754"
    } else {
        ctx.strokeStyle = "#dc3545"
    }
    tick++;

    snakeX += 12 * perlin.get(0.8176, tick * 0.01);
    snakeY += 12 * perlin.get(0.125, tick * 0.01);

    if(snakeX < 0) {
        snakeX = canvas.width;
    }
    if(snakeY < 0) {
        snakeY = canvas.height;
    }
    if(snakeX > canvas.width) {
        snakeX = 0;
    }
    if(snakeY > canvas.height) {
        snakeY = 0;
    }

    if(snakeX < RADIUS) {
        drawSnake(snakeX + canvas.width, snakeY)
    }
    if(snakeY < RADIUS) {
        drawSnake(snakeX, snakeY + canvas.height)
    }
    if(snakeX > canvas.width - RADIUS) {
        drawSnake(snakeX - canvas.width, snakeY)
    }
    if(snakeY > canvas.height - RADIUS) {
        drawSnake(snakeX, snakeY - canvas.height)
    }

    drawSnake(snakeX, snakeY)
}

function drawSnake(x, y) {
    ctx.beginPath();
    ctx.fillStyle = "white"
    ctx.arc(x, y, RADIUS, 2 * Math.PI, 0, true);
    ctx.fill()
    ctx.stroke();
}