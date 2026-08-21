package desafio;

public class Desafio {
//seta atributos
    private String nome;
    private int nivel;
    private double Vida;
    private Boolean chefe;
//permite armezenar varios personagens
    public String getNome() {
        return nome;
    }
    public void setNome(String nome) {
        this.nome = nome;
    }
    public int getNivel() {
        return nivel;
    }
    public void setNivel(int nivel) {
        this.nivel = nivel;
    }
    public double getVida() {
        return Vida;
    }
    public void setVida(double newVida) {
        int vidamaxima = 100;
        if (newVida <= vidamaxima) {
            Vida = newVida;
        }
    }
    public Boolean getChefe() {
        return chefe;
    }
    public void setChefe(Boolean chefe) {
        this.chefe = chefe;
    }
//declarar personagem
    public static void main(String[] args) {
        System.out.println("Hello World"); // escrave hello word
        Desafio Ronaldo = new Desafio();

        Ronaldo.setNome("Ronaldo");
        Ronaldo.setNivel(20);
        Ronaldo.setVida(200);
        Ronaldo.setChefe(true);
        for (Desafio personagem: new Desafio[]{Ronaldo}) {
            System.out.println(personagem.getNome() + " é nivel " + personagem.getNivel() + " e chega a " + personagem.getVida() + " de vida, Chefe: "+ personagem.getChefe());
        }
    }
}