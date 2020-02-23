
import { html, css } from 'lit-element';
import { VrgBase } from '../../vrg-base.js'

export class VrgElementDesc extends VrgBase {
    //we need to init values in constructor

    static get properties() {
        return {
            elements: Array,
            elementViewedIndex: Number,
            userId:String,
            actionId:Number,
        }
    }

    constructor() {
        super()
        this.elements = [];
        this.elementViewedIndex = 0;
    }

    get selfStyles() {
        return css`.action{
            color:black;
            display: flex;
            background-color: lightgrey;
            padding: 0.5em;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            margin-top:1em;
        }
        .action:hover{
            display: flex;
            background-color: grey;
            box-shadow: 0 2px 4px rgba(0,0,0,0.12), 0 2px 3px rgba(0,0,0,0.24);
        }
        .has-overtip{
            position: relative;
            display: inline-block;
        }
        .overtip{
            visibility: hidden;
            
            background-color: grey;
            width: 160px;
            color: #fff;
            text-align: center;
            padding: 5px 0;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            padding:1em;
            
            font-weight: 400;
            font-size: 0.75rem;
            line-height: 1.5;

            /* Position the tooltip text - see examples below! */
            position: absolute;
            z-index: 1;
            bottom: 100%;
            left: 50%;
            margin-left: -140px; /* Use half of the width (120/2 = 60), to center the tooltip */
        }
        .overtip::after {
            content: " ";
            position: absolute;
            top: 100%; /* At the bottom of the tooltip */
            left: 50%;
            margin-top: -10px;
            border-width: 10px;
            border-style: solid;
            border-color: transparent transparent transparent grey;
        }
        .has-overtip:hover .overtip {
            visibility: visible;
        }`
    }

    increaseElementViewedIndex() {
        this.elementViewedIndex++;
        if (this.elementViewedIndex >= this.elements.length) {
            this.elementViewedIndex = 0;
        }
    }

    decreaseElementViewedIndex() {
        this.elementViewedIndex--;
        if (this.elementViewedIndex <= 0) {
            this.elementViewedIndex = this.elements.length - 1;
        }
    }

    displayTooltip() {
        if (this.elements && this.elements.length > 0) {
            let elem = this.elements[this.elementViewedIndex];
            return html`<div class="flex-box f-vertical f-j-space tooltip card">
                            <h4>${this.elements.length > 1 ? html`<span @click=${this.decreaseElementViewedIndex}>🡄</span>` : ``}<span style="width:100%" class="${elem.overtip ? 'has-overtip' : ''}">${elem.name}${elem.overtip ? html`<div class='overtip'>${elem.overtip}</div>` : ''}</span>${this.elements.length > 1 ? html`<span @click=${this.increaseElementViewedIndex}>🡆</span>` : ``}</h4>
                            <p>${elem.desc}</p>
                            ${elem.fuel !== undefined ? html`<div class="has-overtip">fuel : ${elem.fuel}/${elem.fuelMax} <div class="overtip">When there is no fuel left, you can't burn anymore. Land on a planet to refuel.</div></div>` : ``}
                            ${elem.damage ? html`<div class="has-overtip">damage : ${elem.damage} <div class="overtip">crew is repairing and ship can't burn for this number of round</div></div>` : ``}
                            ${this.drawActions(elem)}
                            ${this.drawPlannedActions(elem)}
                        </div>`
        }
        return '';
    }

    drawActions(selectedElement) {
        if (selectedElement.actions && selectedElement.owner == this.userId) {
            return html`<div class="flex-box f-vertical f-j-space">
                            <span>Actions : </span>
                            ${selectedElement.actions.map(action => html`<div 
                                                                    class="action flex-box f-horizontal f-j-space" 
                                                                    @click="${() => this.emit('select-action', {
                action,
                element: selectedElement
            })}">
                                                                        ${action.name}${this.selectedActionId == action.id ?
                    html`<span 
                                                                                    @click="${e => {
                            e.stopPropagation();
                            this.selectedAction = undefined;
                            this.mapRenderer.cancelAction()
                        }}">X</span>` :
                    ``}
                                                                </div>`)}
                        </div>`
        } else {
            return html``
        }
    }

    drawPlannedActions(selectedElement) {
        if (selectedElement.plannedActions && selectedElement.owner == this.userId) {
            return html`<div class="flex-box f-vertical f-j-space"><span>Planned actions : </span>
            ${selectedElement.plannedActions.map(action => html`<div class="action flex-box f-horizontal f-j-space">
                                            ${action.name}<span @click="${e => {this.emit('cancel-action', action)}}">X</span>
                                        </div>`)}
            </div>`
        } else {
            return html``
        }
    }

    render() {
        return html`
        ${this.styles}
        ${this.displayTooltip()}`
    }
}
customElements.define('vrg-element-desc', VrgElementDesc); 
