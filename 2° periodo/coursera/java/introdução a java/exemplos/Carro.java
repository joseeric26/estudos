
import java.time.LocalDate;
import java.time.Period;

public class Carro {
//declarra atributos
    private int velocidade;
    private int gasolina;
    private boolean estadoMotor;
    private String nome;
//como funciona o uso dos atibutos
    public String getNome() {
        return nome;
    }
    public void setNome(String nome) {
        this.nome = nome;
    }
    public int getVelocidade() {
        return velocidade;
    }
    public void setVelocidade(int velocidade) {
        this.velocidade = velocidade;
    }
    Carro (){}
    Carro(int newvelocidade) {
        velocidade = newvelocidade;
    }
    private LocalDate manufaturado;
    public LocalDate getManufaturado() {
        return manufaturado;
    }
    public void setManufaturado(LocalDate manufaturado) {
        this.manufaturado = manufaturado;
    }
    public int getidade(){
        return Period.between(manufaturado, LocalDate.now()).getYears();

    }
//adicionar à classe
    public static void main(String[] args) {
        Carro carro54 = new Carro();
        carro54.setNome("Carro 54");
        carro54.setVelocidade(20);
        carro54.setManufaturado(LocalDate.of(1961, 9,  17));
        Carro mach5 = new Carro();
        mach5.setNome("Mach 5");
        mach5.setVelocidade(250);
        mach5.setManufaturado(LocalDate.of(1967, 4, 2));
    //o que vai ser mostrado
        for (Carro carro: new Carro[]{carro54, mach5}) {
            System.out.println(carro.getNome() + " tem "+ carro.getidade() +" anos e chega a " + carro.getVelocidade());
        }
    }
}