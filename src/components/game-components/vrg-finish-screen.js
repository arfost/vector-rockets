
import { html, css } from 'lit-element';
import { VrgBase } from '../../vrg-base.js'
import  '../../components/btn-loader.js';

export class VrgFinishScreen extends VrgBase {
    //we need to init values in constructor

    static get properties() {
        return {
            scenario: Object,
            players: Array,
            userId: Object,
        }
    }

    getPlayer(){
        if(!this.players){
            return {}
        }else{
            return this.players.find(player=>player.uid == this.userId)
        }
    }

    constructor() {
        super()
    }

    get selfStyles() {
        return css`
        .objectif-title{
            font-weight: bold;
            margin-top: 2em;
        }
        .objectif-sub{
            font-size:0.8em;
            font-weight: normal;
        }
        .objectif{
            margin-left:1em;
        }`
    }

    displayObjectif(obj){
        return html`<div class="objectif">${obj.name} : ${obj.done ? "done" : "not done"} <icon-overtip class="fas fa-question-circle ml-1" ?hidden="${!obj.desc}" color="grey" size="1em" overtip="${obj.desc}"></icon-overtip></div>`
    }

    render() {
        return html`
        ${this.styles}
        ${
            this.scenario && this.players && this.scenario.winner ? 
            html`
            <div>
                <div>Game finished</div>
                <div>The winner is ${this.scenario.winner.name}</div>
                ${this.players.map(player=>html`
                    <div class="flex-box f-vertical">
                        <div class="objectif-title ${this.getPlayer().uid === player.uid ? 'self-objectives' : ''}">objectives : <span class="objectif-sub">(hover for more infos)</span></div> 
                        ${player.objectives.map(obj=>this.displayObjectif(obj))}
                    </div>`
                )}
            </div>` : 
            html`loading`
        }`
    }
}
customElements.define('vrg-finish-screen', VrgFinishScreen); 
