
import { html, css } from 'lit-element';
import Datavault from '../../datavault.js';
import { VrgBase } from '../../vrg-base.js'
import  '../../components/btn-loader.js';

export class VrgScenarioPreparation extends VrgBase {
    //we need to init values in constructor
    get scenarioList(){
        return [{
            name:"Introduction scenario",
            desc:"A simple race around the solar system, to understand navigation.",
            id:"intro",
            maxPlayer:4,
            options:[{
                type:"boolean",
                id:"ss",
                name:"same start",
                desc:"All players began on the earth, otherwise they are spread on different starting planet",
                default:false
            },{
                type:"boolean",
                id:"weaponsAvailable",
                name:"Weapon available",
                desc:"There is weapon on your ship, and you can use them on the others players.",
                default:false
            }]
        }]
    }

    static get properties() {
        return {
            players: Array,
            user: Object,
            selectedScenario: String
        }
    }

    getPlayer(){
        if(!this.players){
            return {}
        }else{
            return this.players.find(player=>player.uid == this.userId)
        }
    }

    prepareAndLaunchConfig(){
        let scenario = this.scenarioList.find(sc=>sc.id === this.selectedScenario);

        if(scenario.maxPlayer<this.players.length){
            this.emit('toast-msg', 'There is too many players for this scenario');
            return
        }
        let config = {
            id:scenario.id
        }
        for(let element of scenario.options){
            let value
            if(element.type){
                value = this.shadowRoot.getElementById(element.id).checked;
            }else{
                value = this.shadowRoot.getElementById(element.id).value;
            }
            config[element.id] = value;
        }
        this.shadowRoot.getElementById('launch').textMode = false;
        Datavault.refGetter.getGame(this.user.game).actions.launchGame(this.user.game, config).then(()=>{
            this.shadowRoot.getElementById('launch').textMode = true;
            this.emit('toast-msg', 'Game started');
        }).catch(e=>{
            this.shadowRoot.getElementById('launch').textMode = true;
            this.emit('toast-msg', 'Error : the game could not be started');
        });
    }

    htmlInputForConfig(config){
        switch(config.type){
            case "boolean": 
                return html`
                <label class="switch">
                    <input type="checkbox" id="${config.id}" name="${config.name}" ?checked="${config.default}">
                    <span class="slider round"></span>
                </label>
                <label for="${config.name}">${config.name}</label>`
        }
    }

    scenarioDetails(){
        let scenario = this.scenarioList.find(sc=>sc.id=this.selectedScenario);
        if(scenario){
            return html`
        <div>
            <h6>${scenario.name} (${this.players.length+"/"+scenario.maxPlayer})</h6>
            ${scenario.desc}
            <h6>config</h6>
            <div>
                ${scenario.options.map(el=>html`<div>${this.htmlInputForConfig(el)}<icon-overtip class="fas fa-question-circle ml-1" ?hidden="${!el.desc}" color="grey" size="1em" overtip="${el.desc}"></icon-overtip></div>`)}
            </div>
        </div>    
        `}
        return ''
    }

    constructor() {
        super()
        this.selectedScenario = "intro"
    }

    get selfStyles() {
        return css`
        .self {
            text-decoration: underline
        }
        .selected{
            background-color:grey;
            padding:0 0.3em;
        }`
    }
    
    displayToken(){
        return html`<p>Token : ${this.user.game}<icon-overtip class="fas fa-copy ml-1" color="grey" size="1em" overtip="copy to clipboard" @click="${this.copyStringToClipboard}"></icon-overtip></p>`
    }

    
    copyStringToClipboard () {
        // Create new element
        var el = document.createElement('textarea');
        // Set value (string to be copied)
        el.value = this.user.game;
        // Set non-editable to avoid focus and move outside of view
        el.setAttribute('readonly', '');
        el.style = {position: 'absolute', left: '-9999px'};
        document.body.appendChild(el);
        // Select text inside element
        el.select();
        // Copy text to clipboard
        document.execCommand('copy');
        // Remove temporary element
        document.body.removeChild(el);

        this.emit('toast-msg', `Game token copied to clipboard`);
     }


    render() {
        return html`
        ${this.styles}
        ${
            this.players ? 
            html`
            <div class="flex-box f-horizontal">
                <div class="flex-box f-vertical f-j-start">
                    <div>Players : </div>
                    <ul>
                        ${this.players.map(player=>html`<li style="color:#${player.color}" class="${player.uid === this.user.id ? 'self': ''}">${player.name}</li>`)}
                    </ul>
                </div>
                <div class="flex-box f-vertical m-1">
                    <h3>Preparing</h3>
                    <h5>Configure scenario</h5>
                    <p>You can choose a scenario and configure it. For your first game I advice using the introduction scenario.</p>
                    <div class="flex-box f-horizontal f-j-start">
                        <div class="mr-1">
                            ${this.scenarioList.map(sc=>html`<div @click="${e=>this.selectedScenario = sc.id}" class="${this.selectedScenario === sc.id ? "selected" : ""}">${sc.name}</div>`)}
                        </div>
                        <div>
                            ${this.scenarioDetails()}
                        </div>
                    </div>
                    <h5>Invite player</h5>
                    <p>You can invite people to this game by giving this token above. There is no chat for now, so use any other messaging system you'd like for that.</p>
                    <p>When ready, click the button on the right.</p>
                    ${this.displayToken()}
                </div>
                <div>
                    <btn-loader id="launch" @click="${this.prepareAndLaunchConfig}">
                        launch
                    </btn-loader>
                </div>
            </div>` : 
            html`loading`
        }`
    }
}
customElements.define('vrg-scenario-preparation', VrgScenarioPreparation); 
